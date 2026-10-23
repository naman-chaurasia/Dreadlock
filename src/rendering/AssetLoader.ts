import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssetLoader {
  private static instance: AssetLoader;
  private gltfLoader: GLTFLoader;
  private textureLoader: THREE.TextureLoader;

  private modelCache = new Map<string, GLTF>();
  private textureCache = new Map<string, THREE.Texture>();

  private constructor() {
    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
  }

  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  /**
   * Asynchronously loads a glTF / GLB model with memory caching and error fallback.
   */
  public async loadModel(url: string): Promise<GLTF | null> {
    if (this.modelCache.has(url)) {
      return this.modelCache.get(url)!;
    }

    return new Promise((resolve) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          // Enable shadow casting and receiving on all child meshes
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          this.modelCache.set(url, gltf);
          resolve(gltf);
        },
        undefined,
        (err) => {
          console.warn(`[AssetLoader] Model "${url}" not found or failed to load. Using fallback geometry.`, err);
          resolve(null);
        }
      );
    });
  }

  /**
   * Asynchronously loads a texture with caching and PBR color space configuration.
   */
  public async loadTexture(url: string, isColorMap = false): Promise<THREE.Texture | null> {
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url)!;
    }

    return new Promise((resolve) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          if (isColorMap) {
            texture.colorSpace = THREE.SRGBColorSpace;
          }
          this.textureCache.set(url, texture);
          resolve(texture);
        },
        undefined,
        () => {
          console.warn(`[AssetLoader] Texture "${url}" not found. Using procedural fallback.`);
          resolve(null);
        }
      );
    });
  }
}

/**
 * Skeletal Animation Controller for rigged characters (Guest & Warden)
 * Handles smooth cross-fading between Idle, Walk, Run, Jump, and Interact states.
 */
export class CharacterAnimationController {
  public mixer: THREE.AnimationMixer;
  public actions = new Map<string, THREE.AnimationAction>();
  public currentAction: THREE.AnimationAction | null = null;

  constructor(rootObject: THREE.Object3D, animations: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(rootObject);

    for (const clip of animations) {
      const action = this.mixer.clipAction(clip);
      this.actions.set(clip.name.toLowerCase(), action);
    }
  }

  public play(name: string, fadeDuration = 0.2): void {
    const targetAction = this.actions.get(name.toLowerCase());
    if (!targetAction || targetAction === this.currentAction) return;

    if (this.currentAction) {
      this.currentAction.fadeOut(fadeDuration);
    }

    targetAction.reset().fadeIn(fadeDuration).play();
    this.currentAction = targetAction;
  }

  public update(deltaSeconds: number): void {
    this.mixer.update(deltaSeconds);
  }
}

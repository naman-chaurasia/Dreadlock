import * as THREE from 'three';

export interface PerformanceStats {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  resolution: string;
}

export class PerformanceMonitor {
  private renderer: THREE.WebGLRenderer;
  private frames = 0;
  private fps = 60;
  private frameTimeMs = 16.6;
  private updateIntervalMs = 250;
  private lastUpdate = performance.now();

  private fpsEl: HTMLElement | null = null;
  private msEl: HTMLElement | null = null;
  private callsEl: HTMLElement | null = null;
  private trisEl: HTMLElement | null = null;
  private geomsEl: HTMLElement | null = null;
  private texturesEl: HTMLElement | null = null;
  private resEl: HTMLElement | null = null;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
    this.bindElements();
  }

  private bindElements(): void {
    this.fpsEl = document.getElementById('stat-fps');
    this.msEl = document.getElementById('stat-ms');
    this.callsEl = document.getElementById('stat-calls');
    this.trisEl = document.getElementById('stat-tris');
    this.geomsEl = document.getElementById('stat-geoms');
    this.texturesEl = document.getElementById('stat-textures');
    this.resEl = document.getElementById('stat-res');
  }

  public update(): void {
    const now = performance.now();
    this.frames++;

    if (now - this.lastUpdate >= this.updateIntervalMs) {
      const elapsed = (now - this.lastUpdate) / 1000;
      this.fps = Math.round(this.frames / elapsed);
      this.frameTimeMs = Math.round((elapsed / this.frames) * 1000 * 10) / 10;
      this.frames = 0;
      this.lastUpdate = now;

      this.renderStats();
    }
  }

  public getStats(): PerformanceStats {
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    const pixelRatio = this.renderer.getPixelRatio();
    const effectiveW = Math.round(size.x * pixelRatio);
    const effectiveH = Math.round(size.y * pixelRatio);

    return {
      fps: this.fps,
      frameTimeMs: this.frameTimeMs,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      resolution: `${effectiveW}×${effectiveH}`
    };
  }

  private renderStats(): void {
    const stats = this.getStats();

    if (this.fpsEl) {
      this.fpsEl.textContent = `${stats.fps}`;
      if (stats.fps >= 50) {
        this.fpsEl.className = 'diag-val good';
      } else if (stats.fps >= 28) {
        this.fpsEl.className = 'diag-val warn';
      } else {
        this.fpsEl.className = 'diag-val';
      }
    }

    if (this.msEl) {
      this.msEl.textContent = `${stats.frameTimeMs} ms`;
    }

    if (this.callsEl) {
      this.callsEl.textContent = `${stats.drawCalls}`;
    }

    if (this.trisEl) {
      this.trisEl.textContent = stats.triangles.toLocaleString();
    }

    if (this.geomsEl) {
      this.geomsEl.textContent = `${stats.geometries}`;
    }

    if (this.texturesEl) {
      this.texturesEl.textContent = `${stats.textures}`;
    }

    if (this.resEl) {
      this.resEl.textContent = stats.resolution;
    }
  }
}

import type { WebGLRenderer } from 'three';

/** Lightweight FPS / frame-time / renderer-stats overlay. */
export class StatsOverlay {
  private frames = 0;
  private lastFlush = performance.now();
  private textEl: HTMLElement;

  constructor(elementId: string) {
    const el = document.getElementById(elementId);
    if (!el) throw new Error(`stats element #${elementId} not found`);
    this.textEl = el;
  }

  /** Call once per rendered frame. */
  frame(renderer: WebGLRenderer, frameTimeMs: number): void {
    this.frames++;
    const now = performance.now();
    const elapsed = now - this.lastFlush;
    if (elapsed < 250) return;

    const fps = (this.frames * 1000) / elapsed;
    const info = renderer.info;
    this.textEl.textContent =
      `FPS      ${fps.toFixed(0)}\n` +
      `frame    ${frameTimeMs.toFixed(2)} ms\n` +
      `draws    ${info.render.calls}\n` +
      `tris     ${info.render.triangles.toLocaleString()}\n` +
      `geoms    ${info.memory.geometries}\n` +
      `texs     ${info.memory.textures}\n` +
      `pixelRatio ${renderer.getPixelRatio().toFixed(2)}`;

    this.frames = 0;
    this.lastFlush = now;
  }
}

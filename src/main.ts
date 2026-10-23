import { Engine } from './core/Engine.js';

window.addEventListener('DOMContentLoaded', () => {
  try {
    const engine = new Engine('webgl-canvas');
    engine.start();

    // Log diagnostic verification info to console
    console.log('%c DREADLOCK // PHASE 2 MINIMAL GRAPHICS PROOF %c', 'background: #00f0d2; color: #04090f; font-weight: bold; padding: 4px 8px;', '');
    console.log('Renderer:', engine.renderer.capabilities.isWebGL2 ? 'WebGL 2.0 Active' : 'WebGL 1.0 Fallback');
    console.log('Max Textures:', engine.renderer.capabilities.maxTextures);
    console.log('Max Vertex Uniforms:', engine.renderer.capabilities.maxVertexUniforms);
    console.log('Ready for Phase 2 inspection.');
  } catch (err) {
    console.error('[DREADLOCK Init Failure]', err);
    const hud = document.getElementById('hud-container');
    if (hud) {
      hud.innerHTML = `
        <div style="background: rgba(255, 0, 60, 0.9); color: white; padding: 24px; font-family: monospace; border-left: 4px solid white; max-width: 600px; margin: 40px auto;">
          <h2 style="margin-bottom: 8px;">DREADLOCK ENGINE INITIALIZATION ERROR</h2>
          <p>${err instanceof Error ? err.message : String(err)}</p>
        </div>
      `;
    }
  }
});

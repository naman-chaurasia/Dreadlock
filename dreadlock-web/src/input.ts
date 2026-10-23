/** Keyboard + pointer-lock mouse look input, allocation-free per frame. */
export class Input {
  private keys = new Set<string>();
  private yaw = 0;
  private pitch = 0;
  private pointerLocked = false;

  constructor(clickTarget: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pointerLocked = false;
    });

    clickTarget.addEventListener('click', () => {
      clickTarget.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === clickTarget;
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch -= e.movementY * 0.0022;
      const limit = Math.PI / 2 - 0.05;
      this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
    });
  }

  get yawRad(): number {
    return this.yaw;
  }

  get pitchRad(): number {
    return this.pitch;
  }

  /** Fills `out` with the horizontal forward vector (x, z), normalized or zero. */
  getForward(out: { x: number; z: number }): void {
    out.x = -Math.sin(this.yaw);
    out.z = -Math.cos(this.yaw);
  }

  /** Fills `out` with the horizontal right vector (x, z). */
  getRight(out: { x: number; z: number }): void {
    out.x = Math.cos(this.yaw);
    out.z = -Math.sin(this.yaw);
  }

  /** Writes movement intent into `out` (x = strafe, z = forward), length <= 1. */
  getMoveAxis(out: { x: number; z: number }): void {
    out.x = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0);
    out.z = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0);
    const len = Math.hypot(out.x, out.z);
    if (len > 1) {
      out.x /= len;
      out.z /= len;
    }
  }
}

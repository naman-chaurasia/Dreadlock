import * as THREE from 'three';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;

  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };

  private yaw = 0;
  private pitch = -0.05;

  private targetYaw = 0;
  private targetPitch = -0.05;

  private position: THREE.Vector3;
  private targetPosition: THREE.Vector3;

  private keys: { [key: string]: boolean } = {};
  private moveSpeed = 6.0;
  private lookSpeed = 0.003;
  private damping = 0.12;

  // Corridor boundary limits
  private bounds = {
    minX: -3.4,
    maxX: 3.4,
    minY: 0.8,
    maxY: 5.2,
    minZ: -14.2,
    maxZ: 9.0
  };

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    // Initial position: looking down the vault towards the shard and exit gate
    this.position = new THREE.Vector3(0, 2.0, 7.5);
    this.targetPosition = this.position.clone();
    this.camera.position.copy(this.position);

    this.initListeners();
    this.updateCameraRotation();
  }

  private initListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.domElement.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.targetYaw -= deltaX * this.lookSpeed;
      this.targetPitch -= deltaY * this.lookSpeed;

      // Pitch clamp (prevent flipping over)
      this.targetPitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.targetPitch));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    this.domElement.addEventListener('wheel', (e) => {
      // Zoom / Forward nudge
      const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.yaw, 0));
      const zoomDelta = Math.sign(e.deltaY) * -0.8;
      this.targetPosition.addScaledVector(forward, zoomDelta);
      this.clampPosition(this.targetPosition);
    }, { passive: true });
  }

  public update(deltaSeconds: number): void {
    // Smooth rotation damping
    this.yaw += (this.targetYaw - this.yaw) * this.damping;
    this.pitch += (this.targetPitch - this.pitch) * this.damping;
    this.updateCameraRotation();

    // Movement calculation
    const moveDir = new THREE.Vector3();
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, this.yaw, 0));
    const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, this.yaw, 0));

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.add(forward);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.sub(forward);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.add(right);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.sub(right);
    if (this.keys['KeyE'] || this.keys['Space']) moveDir.y += 1.0;
    if (this.keys['KeyQ'] || this.keys['ShiftLeft']) moveDir.y -= 1.0;

    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize();
      this.targetPosition.addScaledVector(moveDir, this.moveSpeed * deltaSeconds);
      this.clampPosition(this.targetPosition);
    }

    // Smooth position interpolation
    this.position.lerp(this.targetPosition, this.damping);
    this.camera.position.copy(this.position);
  }

  private updateCameraRotation(): void {
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  private clampPosition(pos: THREE.Vector3): void {
    pos.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, pos.x));
    pos.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, pos.y));
    pos.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, pos.z));
  }
}

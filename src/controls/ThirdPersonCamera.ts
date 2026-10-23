import * as THREE from 'three';
import { CollisionSystem } from '../physics/CollisionSystem.js';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private collision: CollisionSystem;

  public yaw = Math.PI; // Face down corridor by default
  public pitch = 0.22; // Look down slightly towards character

  private targetYaw = Math.PI;
  private targetPitch = 0.22;

  // Spring-arm camera parameters
  private desiredDistance = 3.8;
  private currentDistance = 3.8;
  private heightOffset = 1.35; // Target point on character (mid-chest)

  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private lookSensitivity = 0.0032;
  private damping = 0.15;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, collision: CollisionSystem) {
    this.camera = camera;
    this.domElement = domElement;
    this.collision = collision;

    this.initListeners();
  }

  private initListeners(): void {
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

      this.targetYaw -= deltaX * this.lookSensitivity;
      this.targetPitch += deltaY * this.lookSensitivity;

      // Clamp pitch to avoid ground clipping or overhead inversion
      this.targetPitch = Math.max(-0.25, Math.min(1.05, this.targetPitch));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    this.domElement.addEventListener('wheel', (e) => {
      this.desiredDistance = Math.max(1.8, Math.min(6.5, this.desiredDistance + Math.sign(e.deltaY) * 0.4));
    }, { passive: true });
  }

  public update(targetPos: THREE.Vector3, _deltaSeconds: number): void {
    // Smooth angle interpolation
    this.yaw += (this.targetYaw - this.yaw) * this.damping;
    this.pitch += (this.targetPitch - this.pitch) * this.damping;

    const focusPoint = targetPos.clone().add(new THREE.Vector3(0, this.heightOffset, 0));

    // Calculate ideal camera position based on spherical coordinates
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    );

    let actualDistance = this.desiredDistance;

    // Camera raycast / bounds collision check against corridor walls and ceiling
    const desiredCamPos = focusPoint.clone().addScaledVector(offset, actualDistance);

    // Wall collision checks
    if (desiredCamPos.x < this.collision.bounds.minX + 0.3) {
      actualDistance *= (focusPoint.x - (this.collision.bounds.minX + 0.3)) / (focusPoint.x - desiredCamPos.x);
    } else if (desiredCamPos.x > this.collision.bounds.maxX - 0.3) {
      actualDistance *= (this.collision.bounds.maxX - 0.3 - focusPoint.x) / (desiredCamPos.x - focusPoint.x);
    }

    if (desiredCamPos.y > this.collision.bounds.corridorCeilingY - 0.4) {
      actualDistance *= (this.collision.bounds.corridorCeilingY - 0.4 - focusPoint.y) / (desiredCamPos.y - focusPoint.y);
    } else if (desiredCamPos.y < this.collision.bounds.corridorFloorY + 0.3) {
      actualDistance *= (focusPoint.y - (this.collision.bounds.corridorFloorY + 0.3)) / (focusPoint.y - desiredCamPos.y);
    }

    actualDistance = Math.max(1.2, Math.min(this.desiredDistance, Math.abs(actualDistance)));
    this.currentDistance += (actualDistance - this.currentDistance) * this.damping;

    // Set camera position and look at character
    const finalPos = focusPoint.clone().addScaledVector(offset, this.currentDistance);
    this.camera.position.copy(finalPos);
    this.camera.lookAt(focusPoint);
  }
}

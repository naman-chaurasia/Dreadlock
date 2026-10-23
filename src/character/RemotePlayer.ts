import * as THREE from 'three';
import { MaterialFactory } from '../rendering/Materials.js';
import { PlayerTransform } from '../shared/types.js';
import { AssetLoader, CharacterAnimationController } from '../rendering/AssetLoader.js';

export class RemotePlayer {
  public mesh = new THREE.Group();
  public id: string;
  public name: string;

  private targetPosition = new THREE.Vector3(0, 0, 4.5);
  private currentPosition = new THREE.Vector3(0, 0, 4.5);
  private targetRotationY = Math.PI;
  private currentRotationY = Math.PI;

  private isMoving = false;
  private runCycle = 0;

  // Real 3D Model & Animation
  public animController: CharacterAnimationController | null = null;
  public realModel: THREE.Group | null = null;

  // Body parts
  private torso!: THREE.Group;
  private leftLeg!: THREE.Group;
  private rightLeg!: THREE.Group;
  private leftArm!: THREE.Group;
  private rightArm!: THREE.Group;

  constructor(id: string, name: string, initialPos: PlayerTransform) {
    this.id = id;
    this.name = name;

    this.currentPosition.set(initialPos.x, initialPos.y, initialPos.z);
    this.targetPosition.copy(this.currentPosition);
    this.mesh.position.copy(this.currentPosition);

    this.buildMesh();
    this.loadReal3DModel();
  }

  private loadReal3DModel(): void {
    AssetLoader.getInstance().loadModel('/assets/models/characters/guest_runner.gltf').then((gltf) => {
      if (gltf) {
        // Clone model scene for independent animation tracking on remote peer
        this.realModel = gltf.scene.clone();
        this.realModel.scale.set(0.9, 0.9, 0.9);
        this.realModel.position.set(0, 0, 0);

        // Hide sword and weapon attachments from captive runner
        const swordNode = this.realModel.getObjectByName('Sword');
        if (swordNode) swordNode.visible = false;
        const weaponNode = this.realModel.getObjectByName('Weapon');
        if (weaponNode) weaponNode.visible = false;

        // Enable shadows on all character meshes
        this.realModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.mesh.add(this.realModel);

        // Hide ALL procedural box limbs (torso, arms, head, legs)
        this.torso.visible = false;
        this.leftLeg.visible = false;
        this.rightLeg.visible = false;

        this.animController = new CharacterAnimationController(this.realModel, gltf.animations);
        this.animController.play('Idle_Neutral');
      }
    });
  }

  private buildMesh(): void {
    const mats = MaterialFactory.getInstance();

    // 1. Torso
    this.torso = new THREE.Group();
    this.torso.position.set(0, 0.95, 0);

    const chestGeo = new THREE.BoxGeometry(0.55, 0.58, 0.32);
    const chest = new THREE.Mesh(chestGeo, mats.darkMetalMaterial);
    chest.castShadow = true;
    chest.receiveShadow = true;
    this.torso.add(chest);

    // Glowing Amber/Orange spinal conduit (indicates Opponent / Remote)
    const spineGeo = new THREE.BoxGeometry(0.08, 0.5, 0.04);
    const spineMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.set(0, 0, 0.17);
    this.torso.add(spine);

    // 2. Head with Amber Visor
    const head = new THREE.Group();
    head.position.set(0, 0.45, 0);

    const helmetGeo = new THREE.BoxGeometry(0.32, 0.34, 0.36);
    const helmet = new THREE.Mesh(helmetGeo, mats.concreteMaterial);
    helmet.castShadow = true;
    head.add(helmet);

    // Amber glowing optical visor
    const visorGeo = new THREE.BoxGeometry(0.24, 0.06, 0.04);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0xffaa22 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.02, -0.19);
    head.add(visor);

    this.torso.add(head);

    // 3. Arms
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.38, 0.2, 0);
    const armGeo = new THREE.BoxGeometry(0.14, 0.52, 0.14);
    const armMeshL = new THREE.Mesh(armGeo, mats.darkMetalMaterial);
    armMeshL.position.set(0, -0.22, 0);
    armMeshL.castShadow = true;
    this.leftArm.add(armMeshL);
    this.torso.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.38, 0.2, 0);
    const armMeshR = new THREE.Mesh(armGeo, mats.darkMetalMaterial);
    armMeshR.position.set(0, -0.22, 0);
    armMeshR.castShadow = true;
    this.rightArm.add(armMeshR);
    this.torso.add(this.rightArm);

    this.mesh.add(this.torso);

    // 4. Legs
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, 0.65, 0);
    const legGeo = new THREE.BoxGeometry(0.16, 0.62, 0.16);
    const legMeshL = new THREE.Mesh(legGeo, mats.darkMetalMaterial);
    legMeshL.position.set(0, -0.3, 0);
    legMeshL.castShadow = true;
    this.leftLeg.add(legMeshL);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, 0.65, 0);
    const legMeshR = new THREE.Mesh(legGeo, mats.darkMetalMaterial);
    legMeshR.position.set(0, -0.3, 0);
    legMeshR.castShadow = true;
    this.rightLeg.add(legMeshR);
    this.mesh.add(this.rightLeg);
  }

  public setTargetTransform(pos: PlayerTransform, rotY: number, isMoving: boolean): void {
    this.targetPosition.set(pos.x, pos.y, pos.z);
    this.targetRotationY = rotY;
    this.isMoving = isMoving;
  }

  public update(deltaSeconds: number): void {
    // Smooth interpolation (lerp) towards received network target
    const lerpRate = Math.min(1.0, 16.0 * deltaSeconds);
    this.currentPosition.lerp(this.targetPosition, lerpRate);
    this.mesh.position.copy(this.currentPosition);

    // Smooth rotation lerp
    let diff = this.targetRotationY - this.currentRotationY;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.currentRotationY += diff * lerpRate;
    this.mesh.rotation.y = this.currentRotationY;

    // Skeletal Animation Playback (Real 3D GLTF Model) or Procedural Fallback
    if (this.animController) {
      if (this.isMoving) {
        this.animController.play('Run', 0.15);
      } else {
        this.animController.play('Idle_Neutral', 0.2);
      }
      this.animController.update(deltaSeconds);
    } else {
      // Procedural animation fallback
      if (this.isMoving) {
        this.runCycle += deltaSeconds * 11.5;
        const swing = Math.sin(this.runCycle) * 0.65;
        this.leftLeg.rotation.x = swing;
        this.rightLeg.rotation.x = -swing;
        this.leftArm.rotation.x = -swing * 0.75;
        this.rightArm.rotation.x = swing * 0.75;
        this.torso.position.y = 0.95 + Math.abs(Math.sin(this.runCycle)) * 0.05;
        this.torso.rotation.x = 0.12;
      } else {
        this.runCycle = 0;
        this.leftLeg.rotation.x *= 0.8;
        this.rightLeg.rotation.x *= 0.8;
        this.leftArm.rotation.x *= 0.8;
        this.rightArm.rotation.x *= 0.8;
        this.torso.position.y = 0.95;
        this.torso.rotation.x = 0;
      }
    }
  }

  public dispose(): void {
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }
}

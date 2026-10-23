import * as THREE from 'three';
import { MaterialFactory } from '../rendering/Materials.js';
import { CollisionSystem } from '../physics/CollisionSystem.js';
import { Ambience } from '../audio/Ambience.js';
import { AssetLoader, CharacterAnimationController } from '../rendering/AssetLoader.js';

export class GuestCharacter {
  public mesh = new THREE.Group();
  public position = new THREE.Vector3(0, 0, 6.0); // Spawn in front of rear archway
  public velocity = new THREE.Vector3(0, 0, 0);

  public isGrounded = true;
  public headingAngle = Math.PI; // Face down corridor towards altar (-Z)

  // Character body parts for procedural animation
  private torso!: THREE.Group;
  private head!: THREE.Group;
  private leftArm!: THREE.Group;
  private rightArm!: THREE.Group;
  private leftLeg!: THREE.Group;
  private rightLeg!: THREE.Group;

  // Real 3D GLTF Model & Skeletal Animations
  public animController: CharacterAnimationController | null = null;
  public realModel: THREE.Group | null = null;

  // Animation state
  private runCycle = 0;
  private footstepTriggered = false;
  private isMoving = false;

  // Movement tuning
  private moveSpeed = 5.6; // m/s
  private acceleration = 38.0;
  private drag = 12.0;
  private jumpImpulse = 7.2;
  private gravity = 22.0;

  private collision: CollisionSystem;
  private ambience: Ambience;

  constructor(collision: CollisionSystem, ambience: Ambience) {
    this.collision = collision;
    this.ambience = ambience;

    this.buildCharacterMesh();
    this.loadReal3DModel();
    this.mesh.position.copy(this.position);
  }

  private loadReal3DModel(): void {
    AssetLoader.getInstance().loadModel('/assets/models/characters/guest_runner.gltf').then((gltf) => {
      if (gltf) {
        this.realModel = gltf.scene;
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

        // Hide ALL procedural placeholder limbs (torso, arms, head, legs)
        this.torso.visible = false;
        this.leftLeg.visible = false;
        this.rightLeg.visible = false;

        this.animController = new CharacterAnimationController(this.realModel, gltf.animations);
        this.animController.play('Idle_Neutral');
        console.log('[GuestCharacter] Real 3D Runner loaded with full skeletal animations & clean legs!');
      }
    });
  }

  private buildCharacterMesh(): void {
    const mats = MaterialFactory.getInstance();

    // 1. Torso & Armor Vest
    this.torso = new THREE.Group();
    this.torso.position.set(0, 0.95, 0);

    const chestGeo = new THREE.BoxGeometry(0.55, 0.58, 0.32);
    const chest = new THREE.Mesh(chestGeo, mats.darkMetalMaterial);
    chest.castShadow = true;
    chest.receiveShadow = true;
    this.torso.add(chest);

    // Glowing teal spinal conduit down the back of the captive's armor
    const spineGeo = new THREE.BoxGeometry(0.08, 0.5, 0.04);
    const spineMat = new THREE.MeshBasicMaterial({ color: 0x00f0d2 });
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.set(0, 0, 0.17);
    this.torso.add(spine);

    // 2. Head & Helmet with Visor
    this.head = new THREE.Group();
    this.head.position.set(0, 0.45, 0);

    const helmetGeo = new THREE.BoxGeometry(0.32, 0.34, 0.36);
    const helmet = new THREE.Mesh(helmetGeo, mats.concreteMaterial);
    helmet.castShadow = true;
    this.head.add(helmet);

    // Cyan glowing optical visor slit
    const visorGeo = new THREE.BoxGeometry(0.24, 0.06, 0.04);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f0d2 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.02, -0.19);
    this.head.add(visor);

    this.torso.add(this.head);

    // 3. Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.38, 0.2, 0);
    const armGeo = new THREE.BoxGeometry(0.14, 0.52, 0.14);
    const armMeshL = new THREE.Mesh(armGeo, mats.darkMetalMaterial);
    armMeshL.position.set(0, -0.22, 0);
    armMeshL.castShadow = true;
    this.leftArm.add(armMeshL);
    this.torso.add(this.leftArm);

    // 4. Right Arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.38, 0.2, 0);
    const armMeshR = new THREE.Mesh(armGeo, mats.darkMetalMaterial);
    armMeshR.position.set(0, -0.22, 0);
    armMeshR.castShadow = true;
    this.rightArm.add(armMeshR);
    this.torso.add(this.rightArm);

    this.mesh.add(this.torso);

    // 5. Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, 0.65, 0);
    const legGeo = new THREE.BoxGeometry(0.16, 0.62, 0.16);
    const legMeshL = new THREE.Mesh(legGeo, mats.darkMetalMaterial);
    legMeshL.position.set(0, -0.3, 0);
    legMeshL.castShadow = true;
    this.leftLeg.add(legMeshL);
    this.mesh.add(this.leftLeg);

    // 6. Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, 0.65, 0);
    const legMeshR = new THREE.Mesh(legGeo, mats.darkMetalMaterial);
    legMeshR.position.set(0, -0.3, 0);
    legMeshR.castShadow = true;
    this.rightLeg.add(legMeshR);
    this.mesh.add(this.rightLeg);
  }

  public update(
    deltaSeconds: number,
    inputDir: THREE.Vector2, // X: strafe, Y: forward/backward
    cameraYaw: number,
    jumpRequested: boolean
  ): void {
    // 1. Process Horizontal Movement Input relative to Camera Orbit
    const moveVector = new THREE.Vector3(0, 0, 0);

    if (inputDir.lengthSq() > 0.01) {
      inputDir.normalize();

      // Camera forward in horizontal XZ plane
      const camForward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, cameraYaw, 0));
      const camRight = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, cameraYaw, 0));

      moveVector.addScaledVector(camForward, inputDir.y);
      moveVector.addScaledVector(camRight, inputDir.x);
      moveVector.normalize();

      this.isMoving = true;
    } else {
      this.isMoving = false;
    }

    // 2. Acceleration and Drag in XZ
    const targetVx = moveVector.x * this.moveSpeed;
    const targetVz = moveVector.z * this.moveSpeed;

    if (this.isMoving) {
      this.velocity.x += (targetVx - this.velocity.x) * Math.min(1.0, this.acceleration * deltaSeconds);
      this.velocity.z += (targetVz - this.velocity.z) * Math.min(1.0, this.acceleration * deltaSeconds);

      // Rotate character mesh towards movement heading
      const targetHeading = Math.atan2(moveVector.x, moveVector.z);
      // Smooth shortest-arc angle interpolation
      let angleDiff = targetHeading - this.headingAngle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      this.headingAngle += angleDiff * Math.min(1.0, 14.0 * deltaSeconds);
    } else {
      // Decelerate smoothly
      this.velocity.x *= Math.max(0.0, 1.0 - this.drag * deltaSeconds);
      this.velocity.z *= Math.max(0.0, 1.0 - this.drag * deltaSeconds);
    }

    // 3. Jump and Vertical Physics
    if (jumpRequested && this.isGrounded) {
      this.velocity.y = this.jumpImpulse;
      this.isGrounded = false;
      this.ambience.playJumpSound();
    }

    // Apply gravity
    this.velocity.y -= this.gravity * deltaSeconds;

    // 4. Integrate Kinematic Position
    this.position.x += this.velocity.x * deltaSeconds;
    this.position.y += this.velocity.y * deltaSeconds;
    this.position.z += this.velocity.z * deltaSeconds;

    // 5. Resolve Collisions against Vault geometry & bounds
    const collisionResult = this.collision.resolveCollision(this.position);
    this.isGrounded = collisionResult.isGrounded;

    if (this.isGrounded && this.velocity.y < 0) {
      this.velocity.y = 0;
    }

    // 6. Update Mesh Position and Heading
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.headingAngle;

    // 7. Skeletal Animation Playback (Real 3D GLTF Model) or Procedural Fallback
    if (this.animController) {
      if (this.isMoving && this.isGrounded) {
        this.animController.play('Run', 0.15);
      } else if (!this.isGrounded) {
        this.animController.play('Roll', 0.2);
      } else {
        this.animController.play('Idle_Neutral', 0.2);
      }
      this.animController.update(deltaSeconds);
    } else {
      this.animateProcedural(deltaSeconds);
    }
  }

  private animateProcedural(deltaSeconds: number): void {
    const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);

    if (this.isGrounded && horizontalSpeed > 0.4) {
      // --- RUN ANIMATION ---
      const strideFreq = 11.5; // strides per second
      this.runCycle += deltaSeconds * strideFreq;

      const swingAngle = Math.sin(this.runCycle) * 0.65;
      this.leftLeg.rotation.x = swingAngle;
      this.rightLeg.rotation.x = -swingAngle;

      // Arm swing in counter-motion
      this.leftArm.rotation.x = -swingAngle * 0.75;
      this.rightArm.rotation.x = swingAngle * 0.75;

      // Vertical bounce & forward tilt
      const bounce = Math.abs(Math.sin(this.runCycle)) * 0.05;
      this.torso.position.y = 0.95 + bounce;
      this.torso.rotation.x = 0.12; // forward lean

      // Trigger footstep sound at lowest point of swing
      if (Math.sin(this.runCycle) > 0.85 && !this.footstepTriggered) {
        this.ambience.playFootstepSound();
        this.footstepTriggered = true;
      } else if (Math.sin(this.runCycle) < 0) {
        this.footstepTriggered = false;
      }
    } else if (!this.isGrounded) {
      // --- JUMP / AIR ANIMATION ---
      this.leftLeg.rotation.x = 0.35;
      this.rightLeg.rotation.x = -0.2;
      this.leftArm.rotation.x = -0.4;
      this.rightArm.rotation.x = -0.4;
      this.torso.rotation.x = -0.05;
      this.torso.position.y = 0.95;
    } else {
      // --- IDLE ANIMATION ---
      this.runCycle = 0;
      this.leftLeg.rotation.x *= 0.8;
      this.rightLeg.rotation.x *= 0.8;
      this.leftArm.rotation.x *= 0.8;
      this.rightArm.rotation.x *= 0.8;

      const breath = Math.sin(performance.now() * 0.002) * 0.02;
      this.torso.position.y = 0.95 + breath;
      this.torso.rotation.x = 0;
    }
  }
}

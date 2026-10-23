import * as THREE from 'three';
import { ArenaId } from '../shared/types.js';

export interface BoundingBox3D {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export class CollisionSystem {
  public obstacles: BoundingBox3D[] = [];
  public gateCollider: BoundingBox3D | null = null;
  public lockdownCollider: BoundingBox3D | null = null;
  public altarSurfaceY = 0.4;

  // Global outer facility bounds
  public bounds = {
    minX: -11.0,
    maxX: 11.0,
    minZ: -18.0, // allowed into exit once gate opens
    maxZ: 9.6,
    corridorFloorY: 0.0,
    corridorCeilingY: 5.6
  };

  private playerRadius = 0.38;

  public setArena(arenaId: ArenaId): void {
    this.obstacles = [];
    this.lockdownCollider = null; // drop any active lockdown on arena switch
    if (arenaId === 'LIVING_FOUNDRY') {
      this.bounds = {
        minX: -7.6,
        maxX: 7.6,
        minZ: -17.6,
        maxZ: 9.6,
        corridorFloorY: 0.0,
        corridorCeilingY: 7.2
      };

      // 1. Central energy pit outer lip boundary
      this.obstacles.push({
        min: new THREE.Vector3(-3.2, 0, -8.2),
        max: new THREE.Vector3(-3.0, 1.2, 0.2)
      });
      this.obstacles.push({
        min: new THREE.Vector3(3.0, 0, -8.2),
        max: new THREE.Vector3(3.2, 1.2, 0.2)
      });

      // 2. Pressure chamber column
      this.obstacles.push({
        min: new THREE.Vector3(4.3, 0, -10.2),
        max: new THREE.Vector3(6.7, 4.2, -7.8)
      });

      // 3. Catwalk pillars
      this.obstacles.push({
        min: new THREE.Vector3(-6.4, 0, -5.7),
        max: new THREE.Vector3(-6.0, 3.2, -5.3)
      });
      this.obstacles.push({
        min: new THREE.Vector3(-6.4, 0, -1.2),
        max: new THREE.Vector3(-6.0, 3.2, -0.8)
      });
      this.obstacles.push({
        min: new THREE.Vector3(-6.4, 0, 3.3),
        max: new THREE.Vector3(-6.0, 3.2, 3.7)
      });

      // 4. North blast door frame
      this.gateCollider = {
        min: new THREE.Vector3(-2.6, 0, -15.8),
        max: new THREE.Vector3(2.6, 4.5, -15.2)
      };
      this.obstacles.push(this.gateCollider);
    } else if (arenaId === 'OBSERVATORY') {
      this.bounds = {
        minX: -13.0,
        maxX: 13.0,
        minZ: -14.0,
        maxZ: 13.0,
        corridorFloorY: 0.0,
        corridorCeilingY: 9.5
      };

      // 1. North exit seal portal archway collider
      this.gateCollider = {
        min: new THREE.Vector3(-2.6, 0, -13.2),
        max: new THREE.Vector3(2.6, 5.0, -12.2)
      };
      this.obstacles.push(this.gateCollider);

      // 2. West Gallery inner rail
      this.obstacles.push({
        min: new THREE.Vector3(-6.8, 0, -1.5),
        max: new THREE.Vector3(-6.4, 1.2, 5.5)
      });

      // 3. Upper catwalk pillars
      this.obstacles.push({
        min: new THREE.Vector3(2.2, 0, 7.2),
        max: new THREE.Vector3(2.8, 3.6, 7.8)
      });
      this.obstacles.push({
        min: new THREE.Vector3(5.2, 0, 5.7),
        max: new THREE.Vector3(5.8, 3.6, 6.3)
      });
    } else {
      this.bounds = {
        minX: -11.0,
        maxX: 11.0,
        minZ: -18.0,
        maxZ: 9.6,
        corridorFloorY: 0.0,
        corridorCeilingY: 5.6
      };
      this.buildStaticObstacles();
    }
  }

  constructor() {
    this.buildStaticObstacles();
  }

  private buildStaticObstacles(): void {
    // -----------------------------------------------------------------
    // 1. MAIN HALL WALL OBSTACLES (Leaving doorways open)
    // -----------------------------------------------------------------

    // RIGHT WALL (East)
    // South segment: Z in [-2.5, 10.0]
    this.obstacles.push({
      min: new THREE.Vector3(3.8, 0, -2.5),
      max: new THREE.Vector3(4.6, 5.6, 10.0)
    });
    // Note: Doorway to East Bay is OPEN between Z = -6.0 and Z = -2.5
    // North segment: Z in [-18.0, -6.0]
    this.obstacles.push({
      min: new THREE.Vector3(3.8, 0, -18.0),
      max: new THREE.Vector3(4.6, 5.6, -6.0)
    });

    // LEFT WALL (West)
    // South-most segment: Z in [6.5, 10.0]
    this.obstacles.push({
      min: new THREE.Vector3(-4.6, 0, 6.5),
      max: new THREE.Vector3(-3.8, 5.6, 10.0)
    });
    // Note: South doorway to West Archive is OPEN between Z = 3.5 and Z = 6.5
    // Mid segment: Z in [-2.5, 3.5]
    this.obstacles.push({
      min: new THREE.Vector3(-4.6, 0, -2.5),
      max: new THREE.Vector3(-3.8, 5.6, 3.5)
    });
    // Note: North doorway to West Archive is OPEN between Z = -6.0 and Z = -2.5
    // North segment: Z in [-18.0, -6.0]
    this.obstacles.push({
      min: new THREE.Vector3(-4.6, 0, -18.0),
      max: new THREE.Vector3(-3.8, 5.6, -6.0)
    });

    // -----------------------------------------------------------------
    // 2. MAIN HALL PILLARS & REAR ARCHWAY
    // -----------------------------------------------------------------
    const pillarZPositions = [8, 0, -8, -12];
    for (const z of pillarZPositions) {
      // Left pillar (center X = -3.75, width 0.9, depth 0.9)
      this.obstacles.push({
        min: new THREE.Vector3(-4.3, 0, z - 0.45),
        max: new THREE.Vector3(-3.3, 5.6, z + 0.45)
      });

      // Right pillar (center X = +3.75, width 0.9, depth 0.9)
      this.obstacles.push({
        min: new THREE.Vector3(3.3, 0, z - 0.45),
        max: new THREE.Vector3(4.3, 5.6, z + 0.45)
      });
    }

    // Rear Entrance Archway posts behind spawn
    this.obstacles.push({
      min: new THREE.Vector3(-4.2, 0, 9.5),
      max: new THREE.Vector3(-2.2, 5.6, 10.5)
    });
    this.obstacles.push({
      min: new THREE.Vector3(2.2, 0, 9.5),
      max: new THREE.Vector3(4.2, 5.6, 10.5)
    });

    // -----------------------------------------------------------------
    // 3. CENTRAL ALTAR PYLONS & RELAY CONSOLE
    // -----------------------------------------------------------------
    const angles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    for (const ang of angles) {
      const px = Math.cos(ang) * 1.8;
      const pz = Math.sin(ang) * 1.8;
      this.obstacles.push({
        min: new THREE.Vector3(px - 0.15, 0, pz - 0.15),
        max: new THREE.Vector3(px + 0.15, 1.2, pz + 0.15)
      });
    }

    // Entry Relay Console Base on Altar (at 0, 0.45, -0.8)
    this.obstacles.push({
      min: new THREE.Vector3(-0.85, 0.4, -1.2),
      max: new THREE.Vector3(0.85, 1.8, -0.4)
    });

    // -----------------------------------------------------------------
    // 4. EAST MAINTENANCE BAY PERIMETER & OBSTACLES
    // -----------------------------------------------------------------
    // South Wall: Z in [-1.9, -1.3], X in [4.2, 11.4]
    this.obstacles.push({
      min: new THREE.Vector3(4.2, 0, -1.9),
      max: new THREE.Vector3(11.8, 5.6, -1.3)
    });

    // North Wall: Z in [-8.3, -7.7], X in [4.2, 11.4]
    this.obstacles.push({
      min: new THREE.Vector3(4.2, 0, -8.3),
      max: new THREE.Vector3(11.8, 5.6, -7.7)
    });

    // East Outer Wall: X in [11.1, 11.7], Z in [-8.0, -1.6]
    this.obstacles.push({
      min: new THREE.Vector3(11.1, 0, -8.0),
      max: new THREE.Vector3(11.7, 5.6, -1.6)
    });

    // Heavy Industrial Generator Prop (at 9.8, 0, -3.5)
    this.obstacles.push({
      min: new THREE.Vector3(8.9, 0, -4.7),
      max: new THREE.Vector3(10.7, 2.0, -2.3)
    });

    // Storage Shelf at Back Wall (at 7.5, 0, -7.4)
    this.obstacles.push({
      min: new THREE.Vector3(6.2, 0, -7.7),
      max: new THREE.Vector3(8.8, 2.5, -7.0)
    });

    // -----------------------------------------------------------------
    // 5. WEST ARCHIVE WING PERIMETER & OBSTACLES
    // -----------------------------------------------------------------
    // South Wall: Z in [6.7, 7.3], X in [-11.8, -4.2]
    this.obstacles.push({
      min: new THREE.Vector3(-11.8, 0, 6.7),
      max: new THREE.Vector3(-4.2, 5.6, 7.3)
    });

    // North Wall: Z in [-8.3, -7.7], X in [-11.8, -4.2]
    this.obstacles.push({
      min: new THREE.Vector3(-11.8, 0, -8.3),
      max: new THREE.Vector3(-4.2, 5.6, -7.7)
    });

    // West Outer Wall: X in [-11.7, -11.1], Z in [-8.0, 7.0]
    this.obstacles.push({
      min: new THREE.Vector3(-11.7, 0, -8.0),
      max: new THREE.Vector3(-11.1, 5.6, 7.0)
    });

    // Server Rack Monoliths along West Wall (Z = 4.5, 1.5, -1.5, -4.5 at X = -10.5)
    const rackZPositions = [4.5, 1.5, -1.5, -4.5];
    for (const z of rackZPositions) {
      this.obstacles.push({
        min: new THREE.Vector3(-11.0, 0, z - 0.95),
        max: new THREE.Vector3(-10.1, 4.0, z + 0.95)
      });
    }

    // Central Partition Barrier (at -7.8, 0, 3.0)
    this.obstacles.push({
      min: new THREE.Vector3(-8.1, 0, 0.9),
      max: new THREE.Vector3(-7.5, 3.4, 5.1)
    });

    // Hazard Shortcut Pylons (at -6.0, 0, -4.5) and (-6.0, 0, -2.5)
    this.obstacles.push({
      min: new THREE.Vector3(-6.2, 0, -4.7),
      max: new THREE.Vector3(-5.8, 2.0, -4.3)
    });
    this.obstacles.push({
      min: new THREE.Vector3(-6.2, 0, -2.7),
      max: new THREE.Vector3(-5.8, 2.0, -2.3)
    });

    // -----------------------------------------------------------------
    // 6. SEALED BLAST GATE (at Z = -15.2, blocks passage until opened)
    // -----------------------------------------------------------------
    this.gateCollider = {
      min: new THREE.Vector3(-4.2, 0, -15.4),
      max: new THREE.Vector3(4.2, 5.6, -14.8)
    };
    this.obstacles.push(this.gateCollider);
  }

  /** Disable blast gate collider when door slides open */
  public unlockGate(): void {
    if (this.gateCollider) {
      const idx = this.obstacles.indexOf(this.gateCollider);
      if (idx !== -1) {
        this.obstacles.splice(idx, 1);
      }
      this.gateCollider = null;
    }
  }

  /** Activate a temporary energy barrier across the gate approach (Warden Lockdown). */
  public activateLockdownBarrier(): void {
    if (this.lockdownCollider) return;
    this.lockdownCollider = {
      min: new THREE.Vector3(-3.8, 0, -12.3),
      max: new THREE.Vector3(3.8, 5.6, -11.7)
    };
    this.obstacles.push(this.lockdownCollider);
  }

  /** Remove the temporary lockdown barrier. */
  public deactivateLockdownBarrier(): void {
    if (!this.lockdownCollider) return;
    const idx = this.obstacles.indexOf(this.lockdownCollider);
    if (idx !== -1) this.obstacles.splice(idx, 1);
    this.lockdownCollider = null;
  }

  /**
   * Resolves kinematic sphere/capsule position against bounds and AABB obstacles.
   * Modifies pos in place and returns whether character is grounded.
   */
  public resolveCollision(pos: THREE.Vector3, height: number = 1.7): { isGrounded: boolean } {
    let isGrounded = false;
    const r = this.playerRadius;

    // Check Altar Stepped Platform: cylinder at (0, 0), radius 2.2, height 0.4
    const distToAltarCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
    let currentFloor = this.bounds.corridorFloorY;

    if (distToAltarCenter < 2.2) {
      if (pos.y >= this.altarSurfaceY - 0.15) {
        currentFloor = this.altarSurfaceY;
      } else {
        // Push outward horizontally from altar base if below step height
        const pushDir = new THREE.Vector2(pos.x, pos.z).normalize();
        pos.x = pushDir.x * 2.2;
        pos.z = pushDir.y * 2.2;
      }
    }

    // Floor collision
    if (pos.y <= currentFloor) {
      pos.y = currentFloor;
      isGrounded = true;
    }

    // Ceiling clamp
    if (pos.y + height >= this.bounds.corridorCeilingY) {
      pos.y = this.bounds.corridorCeilingY - height;
    }

    // Outer facility boundary clamps
    if (pos.x - r < this.bounds.minX) pos.x = this.bounds.minX + r;
    if (pos.x + r > this.bounds.maxX) pos.x = this.bounds.maxX - r;

    // Outer length bounds
    const frontLimit = this.gateCollider ? -14.8 : this.bounds.minZ;
    if (pos.z - r < frontLimit) pos.z = frontLimit + r;
    if (pos.z + r > this.bounds.maxZ) pos.z = this.bounds.maxZ - r;

    // Resolve against internal static obstacles (pillars, gate, walls, props)
    for (const obs of this.obstacles) {
      // Check if vertical overlap exists
      const feetY = pos.y;
      const headY = pos.y + height;
      if (headY < obs.min.y || feetY > obs.max.y) continue;

      // Closest point on AABB in XZ
      const closestX = Math.max(obs.min.x, Math.min(pos.x, obs.max.x));
      const closestZ = Math.max(obs.min.z, Math.min(pos.z, obs.max.z));

      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < r * r) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.0001) {
          const overlap = r - dist;
          pos.x += (dx / dist) * overlap;
          pos.z += (dz / dist) * overlap;
        } else {
          // If perfectly inside, push out along shortest axis
          const leftPen = Math.abs(pos.x - obs.min.x);
          const rightPen = Math.abs(pos.x - obs.max.x);
          const backPen = Math.abs(pos.z - obs.min.z);
          const frontPen = Math.abs(pos.z - obs.max.z);
          const minPen = Math.min(leftPen, rightPen, backPen, frontPen);

          if (minPen === leftPen) pos.x = obs.min.x - r;
          else if (minPen === rightPen) pos.x = obs.max.x + r;
          else if (minPen === backPen) pos.z = obs.min.z - r;
          else pos.z = obs.max.z + r;
        }
      }
    }

    return { isGrounded };
  }
}

import * as THREE from 'three';
import { ArenaId, UniversalObjectiveState } from '../shared/types.js';
import { EntryVault } from './EntryVault.js';
import { LivingFoundry } from './LivingFoundry.js';
import { Observatory } from './Observatory.js';
import { EnergyShard } from './EnergyShard.js';
import { ExitGate } from './ExitGate.js';
import { EntryRelay } from './EntryRelay.js';
import { PowerCell } from './PowerCell.js';
import { CollisionSystem } from '../physics/CollisionSystem.js';
import { WardenController } from '../warden/WardenController.js';
import { GuestCharacter } from '../character/GuestCharacter.js';

export class ArenaManager {
  public scene: THREE.Scene;
  public collision: CollisionSystem;
  public warden: WardenController;
  public character: GuestCharacter;

  public activeArenaId: ArenaId = 'ENTRY_VAULT';

  // Arena 01: The Entry Vault
  public entryVault: EntryVault;
  public energyShard: EnergyShard;
  public exitGate: ExitGate;
  public entryRelay: EntryRelay;
  public cellA: PowerCell;
  public cellB: PowerCell;

  // Arena 02: The Living Foundry
  public livingFoundry: LivingFoundry;

  // Arena 03: The Observatory
  public observatory: Observatory;

  constructor(
    scene: THREE.Scene,
    collision: CollisionSystem,
    warden: WardenController,
    character: GuestCharacter
  ) {
    this.scene = scene;
    this.collision = collision;
    this.warden = warden;
    this.character = character;

    // 1. Build Entry Vault instances
    this.entryVault = new EntryVault();
    this.energyShard = new EnergyShard();
    this.exitGate = new ExitGate();
    this.entryRelay = new EntryRelay(this.entryVault.relayPosition);
    this.cellA = new PowerCell('CELL_A', this.entryVault.cellAPosition);
    this.cellB = new PowerCell('CELL_B', this.entryVault.cellBPosition);

    // 2. Build Living Foundry instance
    this.livingFoundry = new LivingFoundry();

    // 3. Build Observatory instance
    this.observatory = new Observatory();

    // 4. Mount initial Arena (Entry Vault)
    this.mountArena('ENTRY_VAULT');
  }

  private unmountCurrent(): void {
    // Unmount Entry Vault
    this.scene.remove(this.entryVault.group);
    this.scene.remove(this.energyShard.group);
    this.scene.remove(this.exitGate.group);
    this.scene.remove(this.entryRelay.group);
    this.scene.remove(this.cellA.group);
    this.scene.remove(this.cellB.group);

    // Unmount Living Foundry
    this.scene.remove(this.livingFoundry.group);

    // Unmount Observatory
    this.scene.remove(this.observatory.group);
  }

  public mountArena(arenaId: ArenaId): void {
    this.activeArenaId = arenaId;
    this.unmountCurrent();

    if (arenaId === 'LIVING_FOUNDRY') {
      // Mount Living Foundry
      this.scene.add(this.livingFoundry.group);

      // Configure collisions and Warden CCTV feeds
      this.collision.setArena('LIVING_FOUNDRY');
      this.warden.setArenaFeeds('LIVING_FOUNDRY');

      // Reposition player
      this.character.position.copy(this.livingFoundry.spawnPosition);
      this.character.mesh.position.copy(this.livingFoundry.spawnPosition);
      this.character.velocity.set(0, 0, 0);

      // Update UI Header
      const subBrand = document.querySelector('.sub-brand');
      if (subBrand) {
        subBrand.textContent = 'SECTOR 02: THE LIVING FOUNDRY • BIOMECHANICAL ENERGY SHAFT';
      }
    } else if (arenaId === 'OBSERVATORY') {
      // Mount Observatory
      this.scene.add(this.observatory.group);

      // Configure collisions and Warden CCTV feeds
      this.collision.setArena('OBSERVATORY');
      this.warden.setArenaFeeds('OBSERVATORY');

      // Reposition player
      this.character.position.copy(this.observatory.spawnPosition);
      this.character.mesh.position.copy(this.observatory.spawnPosition);
      this.character.velocity.set(0, 0, 0);

      // Update UI Header
      const subBrand = document.querySelector('.sub-brand');
      if (subBrand) {
        subBrand.textContent = 'SECTOR 03: THE OBSERVATORY • CELESTIAL ASTRONOMICAL DOME';
      }
    } else {
      // Mount Entry Vault
      this.scene.add(this.entryVault.group);
      this.scene.add(this.energyShard.group);
      this.scene.add(this.exitGate.group);
      this.scene.add(this.entryRelay.group);
      this.scene.add(this.cellA.group);
      this.scene.add(this.cellB.group);

      // Configure collisions and Warden CCTV feeds
      this.collision.setArena('ENTRY_VAULT');
      this.warden.setArenaFeeds('ENTRY_VAULT');

      // Reposition player
      this.character.position.set(0, 0, 6.0);
      this.character.mesh.position.set(0, 0, 6.0);
      this.character.velocity.set(0, 0, 0);

      // Update UI Header
      const subBrand = document.querySelector('.sub-brand');
      if (subBrand) {
        subBrand.textContent = 'SECTOR 01: ENTRY VAULT • ARCHITECT CONTAINMENT FACILITY';
      }
    }

    console.log(`[ArenaManager] Mounted ${arenaId}`);
  }

  private elapsed = 0;

  public update(deltaSeconds: number): void {
    this.elapsed += deltaSeconds;
    if (this.activeArenaId === 'LIVING_FOUNDRY') {
      this.livingFoundry.update(deltaSeconds);
    } else if (this.activeArenaId === 'OBSERVATORY') {
      this.observatory.update(deltaSeconds);
    } else {
      this.energyShard.update(deltaSeconds);
      this.exitGate.update(this.elapsed, deltaSeconds);
      this.cellA.update(this.elapsed, deltaSeconds);
      this.cellB.update(this.elapsed, deltaSeconds);
      this.entryRelay.update(deltaSeconds);
    }
  }

  public applyRemoteObjectiveState(objs: UniversalObjectiveState): void {
    if (this.activeArenaId === 'LIVING_FOUNDRY') {
      if (objs.nodeARestored && !this.livingFoundry.nodes.NODE_A?.isRestored) {
        this.livingFoundry.restoreNode('NODE_A');
      }
      if (objs.nodeBRestored && !this.livingFoundry.nodes.NODE_B?.isRestored) {
        this.livingFoundry.restoreNode('NODE_B');
      }
      if (objs.nodeCRestored && !this.livingFoundry.nodes.NODE_C?.isRestored) {
        this.livingFoundry.restoreNode('NODE_C');
      }
      if (objs.liftPowered) {
        this.livingFoundry.isLiftPowered = true;
      }
      if (objs.liftActive && !this.livingFoundry.isLiftActive) {
        this.livingFoundry.activateServiceLift();
      }
      if (objs.escaped) {
        this.livingFoundry.isExitUnlocked = true;
      }
    } else if (this.activeArenaId === 'OBSERVATORY') {
      if (objs.symbolAAligned && !this.observatory.symbols.SYMBOL_A?.isAligned) {
        this.observatory.alignSymbol('SYMBOL_A');
      }
      if (objs.symbolBAligned && !this.observatory.symbols.SYMBOL_B?.isAligned) {
        this.observatory.alignSymbol('SYMBOL_B');
      }
      if (objs.symbolCAligned && !this.observatory.symbols.SYMBOL_C?.isAligned) {
        this.observatory.alignSymbol('SYMBOL_C');
      }
      if (objs.sealActivated && !this.observatory.isSealActivated) {
        this.observatory.activateSeal();
        this.collision.unlockGate();
      }
      if (objs.escaped) {
        this.observatory.isExitUnlocked = true;
      }
    } else {
      if (objs.cellACollected && !this.cellA.isCollected) {
        this.cellA.collect();
      }
      if (objs.cellBCollected && !this.cellB.isCollected) {
        this.cellB.collect();
      }
      if (objs.cellsInserted >= 2 && !this.entryRelay.isCellASeated) {
        this.entryRelay.seatCell('CELL_A');
        this.entryRelay.seatCell('CELL_B');
      }
      if (objs.relayActivated && !this.entryRelay.isActivated) {
        this.entryRelay.activate();
        this.entryVault.activateAllConduits();
      }
      if (objs.gateUnlocked && this.exitGate.state === 'locked') {
        this.exitGate.openGate();
        this.collision.unlockGate();
      }
    }
  }
}

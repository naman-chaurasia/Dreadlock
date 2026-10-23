import { GuestCharacter } from '../character/GuestCharacter.js';
import { PowerCell } from '../world/PowerCell.js';
import { EntryRelay } from '../world/EntryRelay.js';
import { EntryVault } from '../world/EntryVault.js';
import { ExitGate } from '../world/ExitGate.js';
import { LivingFoundry } from '../world/LivingFoundry.js';
import { Observatory } from '../world/Observatory.js';
import { CollisionSystem } from '../physics/CollisionSystem.js';
import { Ambience } from '../audio/Ambience.js';
import { ArenaId, UniversalObjectiveState } from '../shared/types.js';

export type GameStage =
  // Arena 01: Entry Vault
  | 'SEEK_POWER_CELLS'
  | 'INSERT_POWER_CELLS'
  | 'ACTIVATE_RELAY'
  | 'POWERING_CONDUITS'
  | 'REACH_GATE'
  | 'GATE_OPENING'
  | 'ESCAPE_READY'
  // Arena 02: Living Foundry
  | 'FOUNDRY_RESTORE_NODES'
  | 'FOUNDRY_POWER_LIFT'
  | 'FOUNDRY_RIDE_LIFT'
  | 'FOUNDRY_ESCAPE_READY'
  // Arena 03: The Observatory
  | 'OBSERVATORY_ALIGN_SYMBOLS'
  | 'OBSERVATORY_ACTIVATE_SEAL'
  | 'OBSERVATORY_ESCAPE_READY'
  | 'ESCAPED';

export class ObjectiveManager {
  public currentStage: GameStage = 'SEEK_POWER_CELLS';

  private player: GuestCharacter;
  public cellA: PowerCell;
  public cellB: PowerCell;
  public relay: EntryRelay;
  private vault: EntryVault;
  private gate: ExitGate;
  public livingFoundry?: LivingFoundry;
  public observatory?: Observatory;
  private collision: CollisionSystem;
  private ambience: Ambience;

  public onActionCallback?: (action: any) => void;

  // Interaction UI Elements
  private promptEl: HTMLElement | null = null;
  private objectiveTextEl: HTMLElement | null = null;
  private facilityAlertEl: HTMLElement | null = null;

  // Conduit power sequence timer
  private conduitTimer = 0;
  private conduitDelay = 0.32; // seconds between sequential conduit segments

  constructor(
    player: GuestCharacter,
    cellA: PowerCell,
    cellB: PowerCell,
    relay: EntryRelay,
    vault: EntryVault,
    gate: ExitGate,
    collision: CollisionSystem,
    ambience: Ambience,
    onActionCallback?: (action: 'PICKUP_CELL_A' | 'PICKUP_CELL_B' | 'INSERT_CELLS' | 'ACTIVATE_RELAY' | 'OVERRIDE_GATE' | 'ESCAPE') => void
  ) {
    this.player = player;
    this.cellA = cellA;
    this.cellB = cellB;
    this.relay = relay;
    this.vault = vault;
    this.gate = gate;
    this.collision = collision;
    this.ambience = ambience;
    this.onActionCallback = onActionCallback;

    this.bindUI();
    this.updateHUD();
  }

  private bindUI(): void {
    this.promptEl = document.getElementById('interaction-prompt');
    this.objectiveTextEl = document.querySelector('.objective-text');
    this.facilityAlertEl = document.querySelector('.facility-alert');
  }

  public setArena(arenaId: ArenaId, foundry?: LivingFoundry, observatory?: Observatory): void {
    if (foundry) this.livingFoundry = foundry;
    if (observatory) this.observatory = observatory;
    if (arenaId === 'LIVING_FOUNDRY') {
      this.currentStage = 'FOUNDRY_RESTORE_NODES';
    } else if (arenaId === 'OBSERVATORY') {
      this.currentStage = 'OBSERVATORY_ALIGN_SYMBOLS';
    } else {
      this.currentStage = 'SEEK_POWER_CELLS';
    }
    this.updateHUD();
  }

  public update(deltaSeconds: number, interactPressed: boolean): void {
    // If in Living Foundry, delegate to Foundry objective loop
    if (this.livingFoundry && this.livingFoundry.group.parent) {
      this.updateFoundry(deltaSeconds, interactPressed);
      return;
    }

    // If in Observatory, delegate to Observatory objective loop
    if (this.observatory && this.observatory.group.parent) {
      this.updateObservatory(deltaSeconds, interactPressed);
      return;
    }

    const playerPos = this.player.position;

    // Distances to points of interest
    const distToCellA = playerPos.distanceTo(this.cellA.group.position);
    const distToCellB = playerPos.distanceTo(this.cellB.group.position);
    const distToRelay = playerPos.distanceTo(this.relay.group.position);
    const distToGate = Math.sqrt(playerPos.x * playerPos.x + Math.pow(playerPos.z - (-14.2), 2));

    let activePrompt = '';

    switch (this.currentStage) {
      case 'SEEK_POWER_CELLS': {
        // 1. Proximity to Power Cell A (East Maintenance Bay)
        if (!this.cellA.isCollected && distToCellA < 2.2) {
          activePrompt = '[E] ACQUIRE POWER CELL A [EAST MAINTENANCE]';
          if (interactPressed) {
            this.collectCellA();
          }
        }
        // 2. Proximity to Power Cell B (West Archive Wing)
        else if (!this.cellB.isCollected && distToCellB < 2.2) {
          activePrompt = '[E] ACQUIRE POWER CELL B [WEST ARCHIVE]';
          if (interactPressed) {
            this.collectCellB();
          }
        }
        // 3. Proximity to Entry Relay before having both cells
        else if (distToRelay < 2.5) {
          const count = (this.cellA.isCollected ? 1 : 0) + (this.cellB.isCollected ? 1 : 0);
          activePrompt = `[LOCKED] 2 CELLS REQUIRED [${count}/2 ACQUIRED]`;
        }
        // 4. Proximity to Blast Gate
        else if (distToGate < 3.2) {
          activePrompt = '[SEALED] ENTRY RELAY OFFLINE';
        }
        break;
      }

      case 'INSERT_POWER_CELLS': {
        if (distToRelay < 2.5) {
          activePrompt = '[E] INSERT POWER CELLS INTO RELAY';
          if (interactPressed) {
            this.insertCells();
          }
        } else if (distToGate < 3.2) {
          activePrompt = '[SEALED] POWER CELLS NOT INSERTED';
        }
        break;
      }

      case 'ACTIVATE_RELAY': {
        if (distToRelay < 2.5) {
          activePrompt = '[E] ENGAGE MASTER OVERRIDE LEVER';
          if (interactPressed) {
            this.activateRelay();
          }
        } else if (distToGate < 3.2) {
          activePrompt = '[SEALED] RELAY AWAITING OVERRIDE BREAKER';
        }
        break;
      }

      case 'POWERING_CONDUITS': {
        // Sequentially power up the conduit segments down the corridor
        this.conduitTimer += deltaSeconds;
        if (this.conduitTimer >= this.conduitDelay) {
          this.conduitTimer = 0;
          const { step, fullyPowered } = this.vault.activateNextConduitStep();
          const pitch = 1.0 + step * 0.25;
          this.ambience.playConduitPowerSound(pitch);

          if (fullyPowered) {
            this.currentStage = 'REACH_GATE';
            this.updateHUD();
          }
        }

        if (distToGate < 3.2) {
          activePrompt = '[CHARGING] POWERING CONDUIT RELAYS...';
        }
        break;
      }

      case 'REACH_GATE': {
        if (distToGate < 3.2) {
          activePrompt = '[E] ENGAGE EXIT OVERRIDE';
          if (interactPressed) {
            this.triggerGateUnlock();
          }
        }
        break;
      }

      case 'GATE_OPENING': {
        if (this.gate.state === 'open') {
          this.currentStage = 'ESCAPE_READY';
          this.updateHUD();
        }
        break;
      }

      case 'ESCAPE_READY': {
        // Player steps past the opened gate threshold (Z < -15.6)
        if (playerPos.z < -15.6) {
          this.currentStage = 'ESCAPED';
          this.updateHUD();
          this.onActionCallback?.('ESCAPE');
        }
        break;
      }

      case 'ESCAPED': {
        activePrompt = 'TRIAL COMPLETE // CONTAINMENT BREACHED';
        break;
      }
    }

    // Render on-screen prompt
    if (this.promptEl) {
      if (activePrompt) {
        this.promptEl.textContent = activePrompt;
        this.promptEl.style.display = 'block';
      } else {
        this.promptEl.style.display = 'none';
      }
    }
  }

  public collectCellA(): void {
    if (this.cellA.isCollected) return;
    this.cellA.collect();
    this.ambience.playShardCollectSound();
    this.onActionCallback?.('PICKUP_CELL_A');
    this.checkBothCellsAcquired();
  }

  public collectCellB(): void {
    if (this.cellB.isCollected) return;
    this.cellB.collect();
    this.ambience.playShardCollectSound();
    this.onActionCallback?.('PICKUP_CELL_B');
    this.checkBothCellsAcquired();
  }

  private checkBothCellsAcquired(): void {
    if (this.cellA.isCollected && this.cellB.isCollected) {
      this.currentStage = 'INSERT_POWER_CELLS';
    }
    this.updateHUD();
  }

  public insertCells(): void {
    if (this.relay.isCellASeated && this.relay.isCellBSeated) return;

    this.cellA.placeInSocket(this.relay.socketAPosition);
    this.cellB.placeInSocket(this.relay.socketBPosition);
    this.relay.seatCell('CELL_A');
    this.relay.seatCell('CELL_B');

    this.ambience.playShardCollectSound();
    this.onActionCallback?.('INSERT_CELLS');

    this.currentStage = 'ACTIVATE_RELAY';
    this.updateHUD();
  }

  public activateRelay(): void {
    if (this.relay.isActivated) return;

    this.relay.activate();
    this.ambience.playHydraulicReleaseSound();
    this.onActionCallback?.('ACTIVATE_RELAY');

    this.currentStage = 'POWERING_CONDUITS';
    this.conduitTimer = 0;
    this.updateHUD();
  }

  public triggerGateUnlock(): void {
    this.currentStage = 'GATE_OPENING';
    this.gate.openGate();
    this.collision.unlockGate();

    this.ambience.playHydraulicReleaseSound();
    this.ambience.playGateOpenRumble();
    this.onActionCallback?.('OVERRIDE_GATE');

    this.updateHUD();
  }

  /** Authoritative state synchronization from multiplayer server */
  public applyRemoteObjectiveState(state: UniversalObjectiveState): void {
    if (this.livingFoundry && this.livingFoundry.group.parent) {
      if (state.nodeARestored && !this.livingFoundry.nodes.NODE_A?.isRestored) {
        this.livingFoundry.restoreNode('NODE_A');
      }
      if (state.nodeBRestored && !this.livingFoundry.nodes.NODE_B?.isRestored) {
        this.livingFoundry.restoreNode('NODE_B');
      }
      if (state.nodeCRestored && !this.livingFoundry.nodes.NODE_C?.isRestored) {
        this.livingFoundry.restoreNode('NODE_C');
      }
      if (state.liftPowered && !this.livingFoundry.isLiftPowered) {
        this.livingFoundry.isLiftPowered = true;
        this.currentStage = 'FOUNDRY_POWER_LIFT';
      }
      if (state.liftActive && !this.livingFoundry.isLiftActive) {
        this.livingFoundry.activateServiceLift();
        this.currentStage = 'FOUNDRY_RIDE_LIFT';
      }
      if (state.escaped && this.currentStage !== 'ESCAPED') {
        this.livingFoundry.isExitUnlocked = true;
        this.currentStage = 'ESCAPED';
      }
      this.updateHUD();
      return;
    }

    if (this.observatory && this.observatory.group.parent) {
      if (state.symbolAAligned && !this.observatory.symbols.SYMBOL_A?.isAligned) {
        this.observatory.alignSymbol('SYMBOL_A');
      }
      if (state.symbolBAligned && !this.observatory.symbols.SYMBOL_B?.isAligned) {
        this.observatory.alignSymbol('SYMBOL_B');
      }
      if (state.symbolCAligned && !this.observatory.symbols.SYMBOL_C?.isAligned) {
        this.observatory.alignSymbol('SYMBOL_C');
      }
      if (state.sealActivated && !this.observatory.isSealActivated) {
        this.observatory.activateSeal();
        this.collision.unlockGate();
        this.currentStage = 'OBSERVATORY_ESCAPE_READY';
      }
      if (state.escaped && this.currentStage !== 'ESCAPED') {
        this.observatory.isExitUnlocked = true;
        this.currentStage = 'ESCAPED';
      }
      this.updateHUD();
      return;
    }

    if (state.cellACollected && !this.cellA.isCollected) {
      this.cellA.collect();
    }
    if (state.cellBCollected && !this.cellB.isCollected) {
      this.cellB.collect();
    }

    if (state.cellsInserted >= 2 && (!this.relay.isCellASeated || !this.relay.isCellBSeated)) {
      this.cellA.placeInSocket(this.relay.socketAPosition);
      this.cellB.placeInSocket(this.relay.socketBPosition);
      this.relay.seatCell('CELL_A');
      this.relay.seatCell('CELL_B');
    }

    if (state.relayActivated && !this.relay.isActivated) {
      this.relay.activate();
      this.vault.activateAllConduits();
      this.currentStage = 'REACH_GATE';
    }

    if (state.gateUnlocked && this.gate.state === 'locked') {
      this.gate.openGate();
      this.collision.unlockGate();
      this.currentStage = 'GATE_OPENING';
    }

    if (state.escaped && this.currentStage !== 'ESCAPED') {
      this.currentStage = 'ESCAPED';
    }

    this.updateHUD();
  }

  private updateFoundry(_deltaSeconds: number, interactPressed: boolean): void {
    if (!this.livingFoundry) return;
    const playerPos = this.player.position;
    const lf = this.livingFoundry;

    const distToNodeA = playerPos.distanceTo(lf.nodeAPosition);
    const distToNodeB = playerPos.distanceTo(lf.nodeBPosition);
    const distToNodeC = playerPos.distanceTo(lf.nodeCPosition);
    const distToConsole = playerPos.distanceTo(lf.liftConsolePosition);
    const distToExit = playerPos.distanceTo(lf.exitThresholdPosition);

    let activePrompt = '';

    if (!lf.isLiftPowered) {
      if (!lf.nodes.NODE_A?.isRestored && distToNodeA < 2.4) {
        activePrompt = '[E] RESTORE INTAKE ENERGY NODE [NODE 01]';
        if (interactPressed) {
          lf.restoreNode('NODE_A');
          this.ambience.playShardCollectSound();
          this.onActionCallback?.('RESTORE_NODE_A');
          this.checkFoundryPower();
        }
      } else if (!lf.nodes.NODE_B?.isRestored && distToNodeB < 2.4) {
        activePrompt = '[E] RESTORE ASSEMBLY WALK NODE [NODE 02]';
        if (interactPressed) {
          lf.restoreNode('NODE_B');
          this.ambience.playShardCollectSound();
          this.onActionCallback?.('RESTORE_NODE_B');
          this.checkFoundryPower();
        }
      } else if (!lf.nodes.NODE_C?.isRestored && distToNodeC < 2.4) {
        activePrompt = '[E] RESTORE PRESSURE VESSEL NODE [NODE 03]';
        if (interactPressed) {
          lf.restoreNode('NODE_C');
          this.ambience.playShardCollectSound();
          this.onActionCallback?.('RESTORE_NODE_C');
          this.checkFoundryPower();
        }
      } else if (distToConsole < 2.5) {
        const restored = (lf.nodes.NODE_A?.isRestored ? 1 : 0) + (lf.nodes.NODE_B?.isRestored ? 1 : 0) + (lf.nodes.NODE_C?.isRestored ? 1 : 0);
        activePrompt = `[LOCKED] 3 NODES REQUIRED [${restored}/3 ONLINE]`;
      }
    } else if (!lf.isLiftActive) {
      if (distToConsole < 2.5) {
        activePrompt = '[E] ENGAGE SERVICE LIFT POWER BREAKER';
        if (interactPressed) {
          lf.activateServiceLift();
          this.ambience.playHydraulicReleaseSound();
          this.onActionCallback?.('RIDE_LIFT');
          this.currentStage = 'FOUNDRY_RIDE_LIFT';
          this.updateHUD();
        }
      }
    } else if (lf.isExitUnlocked) {
      if (distToExit < 3.2) {
        activePrompt = '[E] BREACH SECTOR 02 BLAST SEAL // ESCAPE';
        if (interactPressed) {
          this.ambience.playHydraulicReleaseSound();
          this.onActionCallback?.('FOUNDRY_ESCAPE');
          this.currentStage = 'ESCAPED';
          this.updateHUD();
        }
      }
    }

    if (this.promptEl) {
      if (activePrompt) {
        this.promptEl.textContent = activePrompt;
        this.promptEl.style.display = 'block';
      } else {
        this.promptEl.style.display = 'none';
      }
    }
  }

  private checkFoundryPower(): void {
    if (!this.livingFoundry) return;
    const allRestored = Object.values(this.livingFoundry.nodes).every((n) => n.isRestored);
    if (allRestored) {
      this.currentStage = 'FOUNDRY_POWER_LIFT';
      this.onActionCallback?.('POWER_LIFT');
    }
    this.updateHUD();
  }

  private updateObservatory(_deltaSeconds: number, interactPressed: boolean): void {
    if (!this.observatory) return;
    const playerPos = this.player.position;
    const obs = this.observatory;

    const distToSymA = playerPos.distanceTo(obs.symbolAPosition);
    const distToSymB = playerPos.distanceTo(obs.symbolBPosition);
    const distToSymC = playerPos.distanceTo(obs.symbolCPosition);
    const distToConsole = playerPos.distanceTo(obs.sealConsolePosition);
    const distToExit = playerPos.distanceTo(obs.exitThresholdPosition);

    let activePrompt = '';

    const allSymbolsAligned = obs.symbols.SYMBOL_A?.isAligned &&
      obs.symbols.SYMBOL_B?.isAligned &&
      obs.symbols.SYMBOL_C?.isAligned;

    if (!allSymbolsAligned) {
      if (!obs.symbols.SYMBOL_A?.isAligned && distToSymA < 2.5) {
        activePrompt = '[E] ALIGN SYMBOL ALPHA [LOWER ASTROLABE]';
        if (interactPressed) {
          obs.alignSymbol('SYMBOL_A');
          this.ambience.playShardCollectSound();
          this.onActionCallback?.('ALIGN_SYMBOL_A');
          this.checkObservatorySymbols();
        }
      } else if (!obs.symbols.SYMBOL_B?.isAligned && distToSymB < 2.5) {
        activePrompt = '[E] ALIGN SYMBOL BETA [EAST PRISM]';
        if (interactPressed) {
          obs.alignSymbol('SYMBOL_B');
          this.ambience.playShardCollectSound();
          this.onActionCallback?.('ALIGN_SYMBOL_B');
          this.checkObservatorySymbols();
        }
      } else if (!obs.symbols.SYMBOL_C?.isAligned && distToSymC < 2.5) {
        activePrompt = '[E] ALIGN SYMBOL GAMMA [HIGH LENS]';
        if (interactPressed) {
          obs.alignSymbol('SYMBOL_C');
          this.ambience.playShardCollectSound();
          this.onActionCallback?.('ALIGN_SYMBOL_C');
          this.checkObservatorySymbols();
        }
      } else if (distToConsole < 2.5) {
        const count = (obs.symbols.SYMBOL_A?.isAligned ? 1 : 0) +
          (obs.symbols.SYMBOL_B?.isAligned ? 1 : 0) +
          (obs.symbols.SYMBOL_C?.isAligned ? 1 : 0);
        activePrompt = `[SEALED] 3 CELESTIAL SYMBOLS REQUIRED [${count}/3 ALIGNED]`;
      }
    } else if (!obs.isSealActivated) {
      if (distToConsole < 2.5) {
        activePrompt = '[E] ENGAGE CELESTIAL CONDUIT // BREACH SEAL';
        if (interactPressed) {
          obs.activateSeal();
          this.collision.unlockGate();
          this.ambience.playHydraulicReleaseSound();
          this.onActionCallback?.('ACTIVATE_SEAL');
          this.currentStage = 'OBSERVATORY_ESCAPE_READY';
          this.updateHUD();
        }
      }
    } else {
      if (distToExit < 3.5) {
        activePrompt = '[E] CROSS VOID PORTAL // ESCAPE OBSERVATORY';
        if (interactPressed) {
          this.ambience.playShardCollectSound();
          this.onActionCallback?.('OBSERVATORY_ESCAPE');
          this.currentStage = 'ESCAPED';
          this.updateHUD();
        }
      }
    }

    if (this.promptEl) {
      if (activePrompt) {
        this.promptEl.textContent = activePrompt;
        this.promptEl.style.display = 'block';
      } else {
        this.promptEl.style.display = 'none';
      }
    }
  }

  private checkObservatorySymbols(): void {
    if (!this.observatory) return;
    const obs = this.observatory;
    if (obs.symbols.SYMBOL_A?.isAligned && obs.symbols.SYMBOL_B?.isAligned && obs.symbols.SYMBOL_C?.isAligned) {
      this.currentStage = 'OBSERVATORY_ACTIVATE_SEAL';
    }
    this.updateHUD();
  }

  public updateHUD(): void {
    if (!this.objectiveTextEl || !this.facilityAlertEl) {
      this.bindUI();
    }

    switch (this.currentStage) {
      case 'SEEK_POWER_CELLS': {
        const count = (this.cellA.isCollected ? 1 : 0) + (this.cellB.isCollected ? 1 : 0);
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = `ACQUIRE 2 POWER CELLS: EAST MAINTENANCE (CELL A) & WEST ARCHIVE (CELL B) [${count}/2]`;
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = `FACILITY POWER: DORMANT [${count}/2 CELLS RECOVERED]`;
          this.facilityAlertEl.style.color = '#ffaa22';
          this.facilityAlertEl.style.borderColor = 'rgba(255, 170, 34, 0.4)';
        }
        break;
      }

      case 'INSERT_POWER_CELLS':
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = 'BOTH POWER CELLS ACQUIRED // PROCEED TO CENTRAL ENTRY RELAY AT ALTAR';
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = 'ENTRY RELAY: READY FOR CORES [ALTAR CONSOLE]';
          this.facilityAlertEl.style.color = '#00f0d2';
          this.facilityAlertEl.style.borderColor = 'rgba(0, 240, 210, 0.6)';
        }
        break;

      case 'ACTIVATE_RELAY':
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = 'POWER CELLS SEATED // ENGAGE MASTER OVERRIDE LEVER ON CONSOLE';
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = 'RELAY: STANDBY // PULL BREAKER TO ENGAGE GRID';
          this.facilityAlertEl.style.color = '#22ff88';
          this.facilityAlertEl.style.borderColor = 'rgba(34, 255, 136, 0.6)';
        }
        break;

      case 'POWERING_CONDUITS':
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = 'CONDUIT SURGE IN PROGRESS // ENERGIZING RELAYS';
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = 'POWER ROUTING: 5 CONDUITS CHARGING';
          this.facilityAlertEl.style.color = '#00f0d2';
          this.facilityAlertEl.style.borderColor = 'rgba(0, 240, 210, 0.6)';
        }
        break;

      case 'REACH_GATE':
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = 'CONDUITS ENERGIZED // PROCEED TO BLAST GATE FOR OVERRIDE';
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = 'OVERRIDE READY: BLAST GATE KEYSTONE ACTIVE';
          this.facilityAlertEl.style.color = '#00f0d2';
          this.facilityAlertEl.style.borderColor = 'rgba(0, 240, 210, 0.8)';
        }
        break;

      case 'GATE_OPENING':
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = 'HYDRAULIC PRESSURE RELEASING // BLAST SLABS OPENING';
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = 'HYDRAULICS: DISENGAGING PISTONS';
          this.facilityAlertEl.style.color = '#00f0d2';
        }
        break;

      case 'ESCAPE_READY':
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = 'BLAST GATE UNLOCKED // ESCAPE THROUGH THE THRESHOLD';
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = 'EXIT OPEN // PROCEED TO SECTOR TRANSITION';
          this.facilityAlertEl.style.color = '#22ff88';
          this.facilityAlertEl.style.borderColor = 'rgba(34, 255, 136, 0.8)';
        }
        break;

      // Arena 02: Living Foundry HUD States
      case 'FOUNDRY_RESTORE_NODES': {
        const lf = this.livingFoundry;
        const count = lf ? (lf.nodes.NODE_A?.isRestored ? 1 : 0) + (lf.nodes.NODE_B?.isRestored ? 1 : 0) + (lf.nodes.NODE_C?.isRestored ? 1 : 0) : 0;
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = `RESTORE 3 ENERGY NODES: INTAKE (01), CATWALK (02), PRESSURE VESSEL (03) [${count}/3]`;
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = `FOUNDRY POWER: OFFLINE [${count}/3 NODES STABILIZED]`;
          this.facilityAlertEl.style.color = '#ffaa22';
          this.facilityAlertEl.style.borderColor = 'rgba(255, 170, 34, 0.4)';
        }
        break;
      }

      case 'FOUNDRY_POWER_LIFT':
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = 'ALL 3 NODES STABILIZED // PROCEED TO CENTRAL SERVICE LIFT CONSOLE';
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = 'SERVICE LIFT: READY // PULL WINCH BREAKER';
          this.facilityAlertEl.style.color = '#00f0d2';
          this.facilityAlertEl.style.borderColor = 'rgba(0, 240, 210, 0.6)';
        }
        break;

      case 'FOUNDRY_RIDE_LIFT':
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = 'SERVICE LIFT TRAVERSING ENERGY CHASM // PROCEED TO NORTH EXIT PLATFORM';
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = 'HYDRAULIC WINCH: DOCKING AT EXIT PLATFORM';
          this.facilityAlertEl.style.color = '#22ff88';
          this.facilityAlertEl.style.borderColor = 'rgba(34, 255, 136, 0.8)';
        }
        break;

      // Arena 03: The Observatory HUD States
      case 'OBSERVATORY_ALIGN_SYMBOLS': {
        const obs = this.observatory;
        const count = obs ? (obs.symbols.SYMBOL_A?.isAligned ? 1 : 0) + (obs.symbols.SYMBOL_B?.isAligned ? 1 : 0) + (obs.symbols.SYMBOL_C?.isAligned ? 1 : 0) : 0;
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = `ALIGN 3 CELESTIAL SYMBOLS: ALPHA (GALLERY), BETA (CHASM PRISM), GAMMA (HIGH LENS) [${count}/3]`;
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = `CELESTIAL SEAL: LOCKED [${count}/3 ALIGNED]`;
          this.facilityAlertEl.style.color = '#aa77ff';
          this.facilityAlertEl.style.borderColor = 'rgba(170, 119, 255, 0.4)';
        }
        break;
      }

      case 'OBSERVATORY_ACTIVATE_SEAL':
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = 'ALL 3 SYMBOLS ALIGNED // RETURN TO CENTRAL ORRERY DAIS TO BREACH SEAL';
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = 'CELESTIAL CONDUIT: READY // ACTIVATE SEAL CONSOLE';
          this.facilityAlertEl.style.color = '#00d4ff';
          this.facilityAlertEl.style.borderColor = 'rgba(0, 212, 255, 0.6)';
        }
        break;

      case 'OBSERVATORY_ESCAPE_READY':
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = 'CELESTIAL SEAL BREACHED // CROSS NORTH VOID PORTAL TO ESCAPE';
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = 'VOID PORTAL: OPEN // REACH SECTOR EXIT';
          this.facilityAlertEl.style.color = '#22ff88';
          this.facilityAlertEl.style.borderColor = 'rgba(34, 255, 136, 0.8)';
        }
        break;

      case 'ESCAPED':
        if (this.objectiveTextEl) {
          this.objectiveTextEl.textContent = 'TRIAL COMPLETE: GUEST HAS BREACHED THE ENTRY VAULT!';
        }
        if (this.facilityAlertEl) {
          this.facilityAlertEl.textContent = 'SECTOR 01 COMPLETE: REVERSAL ENGINE PRIMED';
          this.facilityAlertEl.style.color = '#00f0d2';
          this.facilityAlertEl.style.borderColor = '#00f0d2';
        }
        break;
    }
  }
}

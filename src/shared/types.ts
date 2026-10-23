/**
 * DREADLOCK — Shared Multiplayer & Match State Types
 * Authoritative Server <-> Browser Client Contract
 */

export type PlayerRole = 'GUEST' | 'WARDEN' | 'UNASSIGNED';

export type ArenaId = 'ENTRY_VAULT' | 'LIVING_FOUNDRY' | 'OBSERVATORY';

export type MatchPhase =
  | 'SOLO'                  // Local single-player mode
  | 'WAITING_FOR_PLAYERS'   // Room created, waiting for Player 2
  | 'READY_COUNTDOWN'       // Exactly 2 players connected, 3s countdown
  | 'LIVE_ROUND'            // Server owns 120s timer
  | 'ROUND_RESOLVE'         // Round boundary reached
  | 'MATCH_OVER';           // 4 rounds completed

export interface PlayerTransform {
  x: number;
  y: number;
  z: number;
}

export interface NetworkPlayerState {
  id: string;
  name: string;
  role: PlayerRole;
  isHost: boolean;
  position: PlayerTransform;
  rotationY: number;
  isMoving: boolean;
  isGrounded: boolean;
}

export interface EntryVaultObjectiveState {
  cellACollected: boolean;
  cellBCollected: boolean;
  cellsInserted: number;      // 0, 1, 2
  relayActivated: boolean;
  gateUnlocked: boolean;
  escaped: boolean;
}

export interface LivingFoundryObjectiveState {
  nodeARestored: boolean;     // Lower Intake Corridor
  nodeBRestored: boolean;     // Elevated Assembly Walk
  nodeCRestored: boolean;     // Pressure Chamber
  liftPowered: boolean;       // Service Lift Console Powered
  liftActive: boolean;        // Service lift platform moving to exit
  escaped: boolean;           // Exit Platform reached
}

export interface ObservatoryObjectiveState {
  symbolAAligned: boolean;    // Lower Gallery
  symbolBAligned: boolean;    // Rotating Bridge
  symbolCAligned: boolean;    // Upper Ring Catwalk
  sealActivated: boolean;     // Central Orrery Exit Seal
  escaped: boolean;           // Void portal crossed
}

export interface UniversalObjectiveState {
  // Arena 01: Entry Vault
  cellACollected: boolean;
  cellBCollected: boolean;
  cellsInserted: number;
  relayActivated: boolean;
  gateUnlocked: boolean;
  // Arena 02: Living Foundry
  nodeARestored?: boolean;
  nodeBRestored?: boolean;
  nodeCRestored?: boolean;
  liftPowered?: boolean;
  liftActive?: boolean;
  // Arena 03: The Observatory
  symbolAAligned?: boolean;
  symbolBAligned?: boolean;
  symbolCAligned?: boolean;
  sealActivated?: boolean;
  // Shared
  escaped: boolean;
}

export type WardenAbilityType = 'BLACKOUT' | 'LOCKDOWN_BARRIER' | 'ARM_PULSE_HAZARD';

export interface FacilityEvent {
  type: WardenAbilityType;
  durationSeconds: number;
  sector: string;
  triggeredBy: string;
}

export interface WardenState {
  energy: number;            // 0 to 100
  maxEnergy: number;         // 100
  blackoutCooldown: number;  // seconds remaining
  lockdownCooldown: number;  // seconds remaining
  hazardCooldown: number;    // seconds remaining
  activeCamera: 'CAM_A' | 'CAM_B' | 'CAM_C' | 'CAM_D';
}

export interface NetworkMatchState {
  roomId: string;
  arenaId: ArenaId;
  phase: MatchPhase;
  roundIndex: number;          // 1 to 4
  roundTimeRemaining: number;  // Exactly 120 seconds in live round
  countdownRemaining: number;  // 3 seconds in countdown
  resolveRemaining: number;    // 5 seconds in round resolve before swap
  players: Record<string, NetworkPlayerState>;
  hostId: string;
  objectives: UniversalObjectiveState;
  wardenState: WardenState;
  scores: {
    hostEscapes: number;
    peerEscapes: number;
    hostRoundWins: number;     // Guest escapes + Warden containments attributed to host
    peerRoundWins: number;     // Guest escapes + Warden containments attributed to peer
  };
}

/** Emitted once per resolved round so the client can show a winner banner. */
export interface RoundResult {
  roundIndex: number;
  winnerRole: PlayerRole;
  winnerName: string;
  reason: 'ESCAPED' | 'CONTAINED';
}

/** Emitted when all 4 rounds are resolved so the client can show a results screen. */
export interface MatchOverData {
  outcome: string;
  hostName: string;
  peerName: string;
  hostRoundWins: number;
  peerRoundWins: number;
}

// Client -> Server events
export interface ClientToServerEvents {
  create_room: (
    data: { playerName: string },
    callback: (res: { success: boolean; roomId: string; error?: string }) => void
  ) => void;

  join_room: (
    data: { roomId: string; playerName: string },
    callback: (res: { success: boolean; roomId: string; error?: string }) => void
  ) => void;

  player_movement: (data: {
    position: PlayerTransform;
    rotationY: number;
    isMoving: boolean;
    isGrounded: boolean;
  }) => void;

  interact_action: (data: {
    actionType:
      | 'PICKUP_CELL_A'
      | 'PICKUP_CELL_B'
      | 'INSERT_CELLS'
      | 'ACTIVATE_RELAY'
      | 'OVERRIDE_GATE'
      | 'ESCAPE'
      | 'RESTORE_NODE_A'
      | 'RESTORE_NODE_B'
      | 'RESTORE_NODE_C'
      | 'POWER_LIFT'
      | 'RIDE_LIFT'
      | 'FOUNDRY_ESCAPE'
      | 'ALIGN_SYMBOL_A'
      | 'ALIGN_SYMBOL_B'
      | 'ALIGN_SYMBOL_C'
      | 'ACTIVATE_SEAL'
      | 'OBSERVATORY_ESCAPE';
  }) => void;

  warden_action: (
    data: { ability: WardenAbilityType },
    callback?: (res: { success: boolean; error?: string }) => void
  ) => void;

  request_rematch: (
    callback?: (res: { success: boolean; error?: string }) => void
  ) => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  match_state_sync: (state: NetworkMatchState) => void;
  player_joined: (player: NetworkPlayerState) => void;
  player_left: (data: { playerId: string }) => void;
  player_moved: (data: {
    id: string;
    position: PlayerTransform;
    rotationY: number;
    isMoving: boolean;
    isGrounded: boolean;
  }) => void;
  objective_updated: (objectives: UniversalObjectiveState) => void;
  facility_event: (event: FacilityEvent) => void;
  warden_state_updated: (state: WardenState) => void;
  server_message: (data: { text: string; type: 'info' | 'warn' | 'alert' }) => void;
  round_resolved: (result: RoundResult) => void;
  match_over: (data: MatchOverData) => void;
}

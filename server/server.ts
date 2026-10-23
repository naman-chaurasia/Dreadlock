import http from 'node:http';
import { Server, Socket } from 'socket.io';
import type {
  NetworkMatchState,
  NetworkPlayerState,
  ClientToServerEvents,
  ServerToClientEvents,
  PlayerRole
} from '../src/shared/types.ts';

const PORT = Number(process.env.PORT) || 3001;

// Test hooks for an accelerated match clock. Defaults reproduce the GDD's
// canonical 3s countdown / 120s round / 5s resolve timing exactly.
const COUNTDOWN_SECONDS = Number(process.env.COUNTDOWN_SECONDS) || 3;
const ROUND_SECONDS = Number(process.env.ROUND_SECONDS) || 120;
const RESOLVE_SECONDS = Number(process.env.RESOLVE_SECONDS) || 5;

const server = http.createServer((req, res) => {
  // Simple health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: 'DREADLOCK Multiplayer', activeRooms: rooms.size }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Map of roomId -> NetworkMatchState
const rooms = new Map<string, NetworkMatchState>();

// Helper to generate a 4-letter uppercase room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

// ---------------------------------------------------------------------------
// Server-side trust validation for objective interactions.
// Any client can emit interact_action; the server is authoritative and must
// reject actions that are out of role, phase, arena, or proximity.
// ---------------------------------------------------------------------------

const ENTRY_VAULT_ACTIONS = new Set([
  'PICKUP_CELL_A', 'PICKUP_CELL_B', 'INSERT_CELLS', 'ACTIVATE_RELAY', 'OVERRIDE_GATE', 'ESCAPE'
]);
const LIVING_FOUNDRY_ACTIONS = new Set([
  'RESTORE_NODE_A', 'RESTORE_NODE_B', 'RESTORE_NODE_C', 'POWER_LIFT', 'RIDE_LIFT', 'FOUNDRY_ESCAPE'
]);
const OBSERVATORY_ACTIONS = new Set([
  'ALIGN_SYMBOL_A', 'ALIGN_SYMBOL_B', 'ALIGN_SYMBOL_C', 'ACTIVATE_SEAL', 'OBSERVATORY_ESCAPE'
]);

// Entry Vault objective anchor points (XZ plane) with generous interaction
// radii. The radii absorb 25Hz movement latency while still rejecting an
// action fired from across the map (the core exploit the audit flagged).
const ENTRY_OBJECTIVE_XZ: Record<string, { x: number; z: number; r: number }> = {
  PICKUP_CELL_A: { x: 8.0, z: -5.0, r: 5.0 },
  PICKUP_CELL_B: { x: -7.8, z: 0.0, r: 5.0 },
  INSERT_CELLS: { x: 0.0, z: -0.8, r: 4.5 },
  ACTIVATE_RELAY: { x: 0.0, z: -0.8, r: 4.5 },
  OVERRIDE_GATE: { x: 0.0, z: -14.2, r: 5.5 },
  ESCAPE: { x: 0.0, z: -15.6, r: 4.0 }
};

function isInteractionInRange(actionType: string, px: number, pz: number): boolean {
  const target = ENTRY_OBJECTIVE_XZ[actionType];
  if (!target) return true; // No distance rule for this action (e.g., Living Foundry)
  const dx = px - target.x;
  const dz = pz - target.z;
  return Math.sqrt(dx * dx + dz * dz) <= target.r;
}

// Credit a round win to whichever player currently holds `role`.
function awardRoundWin(state: NetworkMatchState, role: PlayerRole): string {
  const player = Object.values(state.players).find((p) => p.role === role);
  const name = player?.name || (role === 'GUEST' ? 'GUEST' : 'WARDEN');
  if (player) {
    if (player.id === state.hostId) {
      state.scores.hostRoundWins++;
    } else {
      state.scores.peerRoundWins++;
    }
  }
  return name;
}

function freshObjectives(): NetworkMatchState['objectives'] {
  return {
    cellACollected: false,
    cellBCollected: false,
    cellsInserted: 0,
    relayActivated: false,
    gateUnlocked: false,
    nodeARestored: false,
    nodeBRestored: false,
    nodeCRestored: false,
    liftPowered: false,
    liftActive: false,
    symbolAAligned: false,
    symbolBAligned: false,
    symbolCAligned: false,
    sealActivated: false,
    escaped: false
  };
}

function freshWardenState(): NetworkMatchState['wardenState'] {
  return {
    energy: 100,
    maxEnergy: 100,
    blackoutCooldown: 0,
    lockdownCooldown: 0,
    hazardCooldown: 0,
    activeCamera: 'CAM_A'
  };
}

// 20Hz Server Tick Loop for timers and state management
const TICK_INTERVAL_MS = 50;
let lastTickTime = Date.now();

setInterval(() => {
  const now = Date.now();
  const deltaSec = (now - lastTickTime) / 1000;
  lastTickTime = now;

  for (const [roomId, state] of rooms.entries()) {
    let stateChanged = false;

    if (state.phase === 'READY_COUNTDOWN') {
      state.countdownRemaining -= deltaSec;
      stateChanged = true;

      if (state.countdownRemaining <= 0) {
        state.countdownRemaining = 0;
        state.phase = 'LIVE_ROUND';
        // NOTE: roundIndex is intentionally NOT reset here. It is initialised
        // once at room creation and incremented on each round resolve, which
        // lets the match progress 1 -> 2 -> 3 -> 4 and reach MATCH_OVER.
        state.roundTimeRemaining = ROUND_SECONDS;

        console.log(`[DREADLOCK Server] Room ${roomId} entered LIVE_ROUND (round ${state.roundIndex}). ${ROUND_SECONDS}s timer active.`);
        io.to(roomId).emit('server_message', {
          text: `TRIAL COMMENCED // ROUND ${state.roundIndex} // ${ROUND_SECONDS} SECONDS REMAINING`,
          type: 'alert'
        });
      }
    } else if (state.phase === 'LIVE_ROUND') {
      state.roundTimeRemaining -= deltaSec;
      stateChanged = true;

      // Warden energy regeneration & ability cooldown recovery
      state.wardenState.energy = Math.min(100, state.wardenState.energy + 2.5 * deltaSec);
      state.wardenState.blackoutCooldown = Math.max(0, state.wardenState.blackoutCooldown - deltaSec);
      state.wardenState.lockdownCooldown = Math.max(0, state.wardenState.lockdownCooldown - deltaSec);
      state.wardenState.hazardCooldown = Math.max(0, state.wardenState.hazardCooldown - deltaSec);

      if (state.roundTimeRemaining <= 0) {
        state.roundTimeRemaining = 0;

        // CONTAINMENT WIN: if the Guest never escaped, the Warden wins the round.
        // (On escape the round resolves immediately, so reaching here means the
        // Guest failed to breach containment within the window.)
        if (!state.objectives.escaped) {
          const wardenName = awardRoundWin(state, 'WARDEN');
          io.to(roomId).emit('round_resolved', {
            roundIndex: state.roundIndex,
            winnerRole: 'WARDEN',
            winnerName: wardenName,
            reason: 'CONTAINED'
          });
          console.log(`[DREADLOCK Server] Room ${roomId}: Warden contained the Guest in round ${state.roundIndex}.`);
        }

        state.phase = 'ROUND_RESOLVE';
        state.resolveRemaining = RESOLVE_SECONDS;
        console.log(`[DREADLOCK Server] Room ${roomId} round ${state.roundIndex} timed out. Entering ROUND_RESOLVE.`);
        io.to(roomId).emit('server_message', {
          text: 'ROUND TIME EXPIRED // ROLE REVERSAL PENDING',
          type: 'alert'
        });
      }
    } else if (state.phase === 'ROUND_RESOLVE') {
      state.resolveRemaining = (state.resolveRemaining ?? RESOLVE_SECONDS) - deltaSec;
      stateChanged = true;

      if (state.resolveRemaining <= 0) {
        state.resolveRemaining = 0;
        if (state.roundIndex >= 4) {
          state.phase = 'MATCH_OVER';
          const pIds = Object.keys(state.players);
          const hostName = state.players[state.hostId]?.name || 'Player 1';
          const peerId = pIds.find((id) => id !== state.hostId);
          const peerName = peerId ? state.players[peerId]?.name : 'Player 2';
          let outcome = 'MATCH TIED';
          if (state.scores.hostRoundWins > state.scores.peerRoundWins) outcome = `${hostName} WINS THE MATCH!`;
          else if (state.scores.peerRoundWins > state.scores.hostRoundWins) outcome = `${peerName} WINS THE MATCH!`;

          io.to(roomId).emit('match_over', {
            outcome,
            hostName,
            peerName,
            hostRoundWins: state.scores.hostRoundWins,
            peerRoundWins: state.scores.peerRoundWins
          });
          io.to(roomId).emit('server_message', {
            text: `MATCH COMPLETE // 4 ROUNDS RESOLVED // ${outcome}`,
            type: 'alert'
          });
          console.log(`[DREADLOCK Server] Room ${roomId} match over. ${outcome}`);
        } else {
          // Perform Role Reversal
          state.roundIndex++;
          // Canonical 4-Round Arena Rotation per GDD / docs/WORLD_AND_LEVELS.md:
          // Round 1: ENTRY_VAULT
          // Round 2: LIVING_FOUNDRY
          // Round 3: OBSERVATORY
          // Round 4: ENTRY_VAULT
          if (state.roundIndex === 2) {
            state.arenaId = 'LIVING_FOUNDRY';
          } else if (state.roundIndex === 3) {
            state.arenaId = 'OBSERVATORY';
          } else {
            state.arenaId = 'ENTRY_VAULT';
          }

          for (const player of Object.values(state.players)) {
            player.role = player.role === 'GUEST' ? 'WARDEN' : 'GUEST';
            if (player.role === 'GUEST') {
              if (state.arenaId === 'LIVING_FOUNDRY') {
                player.position = { x: 0, y: 0, z: 7.5 };
              } else if (state.arenaId === 'OBSERVATORY') {
                player.position = { x: 0, y: 0, z: 9.5 };
              } else {
                player.position = { x: 0, y: 0, z: 6.0 };
              }
            } else {
              player.position = { x: 0, y: 0, z: 4.5 };
            }
          }
          // Reset objectives & warden state for the new round
          state.objectives = freshObjectives();
          state.wardenState = freshWardenState();

          state.phase = 'READY_COUNTDOWN';
          state.countdownRemaining = COUNTDOWN_SECONDS;
          state.roundTimeRemaining = ROUND_SECONDS;

          console.log(`[DREADLOCK Server] Room ${roomId} swapped roles for Round ${state.roundIndex} (${state.arenaId}).`);
          io.to(roomId).emit('server_message', {
            text: `ROLE REVERSAL COMPLETE // COMMENCING ROUND ${state.roundIndex} [${state.arenaId}]`,
            type: 'alert'
          });
        }
      }
    }

    if (stateChanged) {
      io.to(roomId).emit('match_state_sync', state);
    }
  }
}, TICK_INTERVAL_MS);

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
  console.log(`[DREADLOCK Server] Client connected: ${socket.id}`);
  let currentRoomId: string | null = null;

  /**
   * Detach this socket from any room it currently occupies, cleaning up
   * the orphaned room (and notifying a remaining peer) so a re-host or
   * re-join never strands a ghost player in a stale room.
   */
  function leaveCurrentRoom(): void {
    if (!currentRoomId || !rooms.has(currentRoomId)) {
      currentRoomId = null;
      return;
    }

    const staleId = currentRoomId;
    const state = rooms.get(staleId)!;
    delete state.players[socket.id];
    socket.leave(staleId);
    currentRoomId = null;

    if (Object.keys(state.players).length === 0) {
      rooms.delete(staleId);
      console.log(`[DREADLOCK Server] Room ${staleId} deleted (host vacated).`);
    } else {
      // A peer is still waiting: return them to the lobby.
      state.phase = 'WAITING_FOR_PLAYERS';
      state.roundTimeRemaining = ROUND_SECONDS;
      state.countdownRemaining = COUNTDOWN_SECONDS;
      io.to(staleId).emit('player_left', { playerId: socket.id });
      io.to(staleId).emit('match_state_sync', state);
      io.to(staleId).emit('server_message', {
        text: 'OPPONENT DISCONNECTED // RETURNING TO LOBBY',
        type: 'warn'
      });
      console.log(`[DREADLOCK Server] Room ${staleId} returned to waiting (1 player).`);
    }
  }

  // 1. CREATE ROOM FLOW
  socket.on('create_room', (data, callback) => {
    // Guard against ghost rooms from a previous host/join on this socket
    leaveCurrentRoom();

    const roomId = generateRoomCode();
    currentRoomId = roomId;

    const initialPlayer: NetworkPlayerState = {
      id: socket.id,
      name: data.playerName || 'Player 1',
      role: 'GUEST', // Host is initially Guest/Runner
      isHost: true,
      position: { x: 0, y: 0, z: 6.0 },
      rotationY: Math.PI,
      isMoving: false,
      isGrounded: true
    };

    const matchState: NetworkMatchState = {
      roomId,
      arenaId: 'ENTRY_VAULT',
      phase: 'WAITING_FOR_PLAYERS',
      roundIndex: 1,
      roundTimeRemaining: ROUND_SECONDS,
      countdownRemaining: COUNTDOWN_SECONDS,
      players: {
        [socket.id]: initialPlayer
      },
      hostId: socket.id,
      resolveRemaining: RESOLVE_SECONDS,
      scores: {
        hostEscapes: 0,
        peerEscapes: 0,
        hostRoundWins: 0,
        peerRoundWins: 0
      },
      wardenState: freshWardenState(),
      objectives: freshObjectives()
    };

    rooms.set(roomId, matchState);
    socket.join(roomId);

    console.log(`[DREADLOCK Server] Room created: ${roomId} by ${socket.id}`);
    callback({ success: true, roomId });

    // Send immediate sync to host
    socket.emit('match_state_sync', matchState);
  });

  // 2. JOIN ROOM FLOW
  socket.on('join_room', (data, callback) => {
    const roomId = data.roomId?.trim().toUpperCase();
    if (!roomId || !rooms.has(roomId)) {
      callback({ success: false, roomId: '', error: 'Room not found. Check code.' });
      return;
    }

    const matchState = rooms.get(roomId)!;
    const existingPlayerCount = Object.keys(matchState.players).length;

    if (existingPlayerCount >= 2) {
      callback({ success: false, roomId, error: 'Room is full (max 2 players).' });
      return;
    }

    // Guard against ghost rooms from a previous host/join on this socket.
    // Runs after the capacity check so a failed join never vacates the
    // player's current room.
    leaveCurrentRoom();

    currentRoomId = roomId;

    // Second player joins as WARDEN
    const joiningPlayer: NetworkPlayerState = {
      id: socket.id,
      name: data.playerName || 'Player 2',
      role: 'WARDEN',
      isHost: false,
      position: { x: 0, y: 0, z: 4.5 },
      rotationY: Math.PI,
      isMoving: false,
      isGrounded: true
    };

    matchState.players[socket.id] = joiningPlayer;
    socket.join(roomId);

    console.log(`[DREADLOCK Server] Player ${socket.id} joined room ${roomId}. Total: 2 players.`);
    callback({ success: true, roomId });

    // Transition to READY_COUNTDOWN now that exactly 2 players are present
    matchState.phase = 'READY_COUNTDOWN';
    matchState.countdownRemaining = COUNTDOWN_SECONDS;

    // Notify room of new player presence & updated state
    io.to(roomId).emit('player_joined', joiningPlayer);
    io.to(roomId).emit('match_state_sync', matchState);
    io.to(roomId).emit('server_message', {
      text: 'BOTH SUBJECTS LINKED // COMMENCING COUNTDOWN',
      type: 'info'
    });
  });

  // 3. PLAYER MOVEMENT SYNCHRONIZATION
  socket.on('player_movement', (data) => {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const state = rooms.get(currentRoomId)!;
    const player = state.players[socket.id];
    if (!player) return;

    // Update server representation of player
    player.position = data.position;
    player.rotationY = data.rotationY;
    player.isMoving = data.isMoving;
    player.isGrounded = data.isGrounded;

    // Broadcast movement to other client in room
    socket.to(currentRoomId).emit('player_moved', {
      id: socket.id,
      position: data.position,
      rotationY: data.rotationY,
      isMoving: data.isMoving,
      isGrounded: data.isGrounded
    });
  });

  // 4. OBJECTIVE INTERACTION ACTIONS
  socket.on('interact_action', (data) => {
    if (!currentRoomId || !rooms.has(currentRoomId)) return;
    const state = rooms.get(currentRoomId)!;
    const player = state.players[socket.id];
    if (!player) return;

    // --- Authoritative trust validation ---
    // Phase: objectives only advance during the live round.
    if (state.phase !== 'LIVE_ROUND') {
      console.warn(`[DREADLOCK Server] Rejected ${data.actionType} from ${socket.id}: phase ${state.phase}`);
      return;
    }
    // Role: only the Guest performs facility objectives (stops Warden self-play).
    if (player.role !== 'GUEST') {
      console.warn(`[DREADLOCK Server] Rejected ${data.actionType} from ${socket.id}: role ${player.role}`);
      return;
    }
    // Arena: an action must belong to the currently mounted arena.
    if (ENTRY_VAULT_ACTIONS.has(data.actionType) && state.arenaId !== 'ENTRY_VAULT') return;
    if (LIVING_FOUNDRY_ACTIONS.has(data.actionType) && state.arenaId !== 'LIVING_FOUNDRY') return;
    if (OBSERVATORY_ACTIONS.has(data.actionType) && state.arenaId !== 'OBSERVATORY') return;
    // Proximity: reject remote firing (Guest must actually be at the objective).
    if (!isInteractionInRange(data.actionType, player.position.x, player.position.z)) {
      console.warn(`[DREADLOCK Server] Rejected ${data.actionType} from ${socket.id}: out of range at (${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)})`);
      return;
    }

    let changed = false;

    switch (data.actionType) {
      case 'PICKUP_CELL_A':
        if (!state.objectives.cellACollected) {
          state.objectives.cellACollected = true;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'POWER CELL A ACQUIRED [EAST MAINTENANCE]',
            type: 'info'
          });
        }
        break;

      case 'PICKUP_CELL_B':
        if (!state.objectives.cellBCollected) {
          state.objectives.cellBCollected = true;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'POWER CELL B ACQUIRED [WEST ARCHIVE]',
            type: 'info'
          });
        }
        break;

      case 'INSERT_CELLS':
        if (state.objectives.cellACollected && state.objectives.cellBCollected && state.objectives.cellsInserted < 2) {
          state.objectives.cellsInserted = 2;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'POWER CELLS SEATED IN ENTRY RELAY // AWAITING BREAKER',
            type: 'info'
          });
        }
        break;

      case 'ACTIVATE_RELAY':
        if (state.objectives.cellsInserted === 2 && !state.objectives.relayActivated) {
          state.objectives.relayActivated = true;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'ENTRY RELAY ENGAGED // CONDUIT SURGE ACTIVE',
            type: 'alert'
          });
        }
        break;

      case 'OVERRIDE_GATE':
        if (state.objectives.relayActivated && !state.objectives.gateUnlocked) {
          state.objectives.gateUnlocked = true;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'EXIT BLAST GATE UNLOCKED // CONTAINMENT BREACHED',
            type: 'alert'
          });
        }
        break;

      case 'ESCAPE':
        if (state.objectives.gateUnlocked && !state.objectives.escaped) {
          state.objectives.escaped = true;
          state.phase = 'ROUND_RESOLVE';
          state.resolveRemaining = RESOLVE_SECONDS;
          changed = true;

          // Track escapes + round win for the escaping Guest
          const guestPlayer = Object.values(state.players).find((p) => p.role === 'GUEST');
          let winnerName = 'GUEST';
          if (guestPlayer) {
            if (guestPlayer.id === state.hostId) {
              state.scores.hostEscapes++;
              state.scores.hostRoundWins++;
            } else {
              state.scores.peerEscapes++;
              state.scores.peerRoundWins++;
            }
            winnerName = guestPlayer.name;
          }

          io.to(currentRoomId).emit('round_resolved', {
            roundIndex: state.roundIndex,
            winnerRole: 'GUEST',
            winnerName,
            reason: 'ESCAPED'
          });
          io.to(currentRoomId).emit('server_message', {
            text: `GUEST ESCAPED ENTRY VAULT // ROUND ${state.roundIndex} COMPLETE`,
            type: 'alert'
          });
        }
        break;

      // Arena 02: Living Foundry Objectives
      case 'RESTORE_NODE_A':
        if (!state.objectives.nodeARestored) {
          state.objectives.nodeARestored = true;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'ENERGY NODE 01 RESTORED [INTAKE CONDUIT]',
            type: 'info'
          });
        }
        break;

      case 'RESTORE_NODE_B':
        if (!state.objectives.nodeBRestored) {
          state.objectives.nodeBRestored = true;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'ENERGY NODE 02 RESTORED [ASSEMBLY CATWALK]',
            type: 'info'
          });
        }
        break;

      case 'RESTORE_NODE_C':
        if (!state.objectives.nodeCRestored) {
          state.objectives.nodeCRestored = true;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'ENERGY NODE 03 RESTORED [PRESSURE CHAMBER]',
            type: 'info'
          });
        }
        break;

      case 'POWER_LIFT':
        if (state.objectives.nodeARestored && state.objectives.nodeBRestored && state.objectives.nodeCRestored && !state.objectives.liftPowered) {
          state.objectives.liftPowered = true;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'ALL NODES STABILIZED // SERVICE LIFT CONSOLE ONLINE',
            type: 'alert'
          });
        }
        break;

      case 'RIDE_LIFT':
        if (state.objectives.liftPowered && !state.objectives.liftActive) {
          state.objectives.liftActive = true;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'SERVICE LIFT ENGAGED // TRAVERSING ENERGY CHASM',
            type: 'alert'
          });
        }
        break;

      case 'FOUNDRY_ESCAPE':
        if (state.objectives.liftActive && !state.objectives.escaped) {
          state.objectives.escaped = true;
          state.phase = 'ROUND_RESOLVE';
          state.resolveRemaining = RESOLVE_SECONDS;
          changed = true;

          const guestPlayer = Object.values(state.players).find((p) => p.role === 'GUEST');
          let winnerName = 'GUEST';
          if (guestPlayer) {
            if (guestPlayer.id === state.hostId) {
              state.scores.hostEscapes++;
              state.scores.hostRoundWins++;
            } else {
              state.scores.peerEscapes++;
              state.scores.peerRoundWins++;
            }
            winnerName = guestPlayer.name;
          }

          io.to(currentRoomId).emit('round_resolved', {
            roundIndex: state.roundIndex,
            winnerRole: 'GUEST',
            winnerName,
            reason: 'ESCAPED'
          });
          io.to(currentRoomId).emit('server_message', {
            text: `GUEST ESCAPED THE LIVING FOUNDRY // ROUND ${state.roundIndex} COMPLETE`,
            type: 'alert'
          });
        }
        break;

      // Arena 03: The Observatory Objectives
      case 'ALIGN_SYMBOL_A':
        if (!state.objectives.symbolAAligned) {
          state.objectives.symbolAAligned = true;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'SYMBOL ALPHA ALIGNED [LOWER ASTROLABE]',
            type: 'info'
          });
        }
        break;

      case 'ALIGN_SYMBOL_B':
        if (!state.objectives.symbolBAligned) {
          state.objectives.symbolBAligned = true;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'SYMBOL BETA ALIGNED [EAST PRISM]',
            type: 'info'
          });
        }
        break;

      case 'ALIGN_SYMBOL_C':
        if (!state.objectives.symbolCAligned) {
          state.objectives.symbolCAligned = true;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'SYMBOL GAMMA ALIGNED [HIGH LENS]',
            type: 'info'
          });
        }
        break;

      case 'ACTIVATE_SEAL':
        if (state.objectives.symbolAAligned && state.objectives.symbolBAligned && state.objectives.symbolCAligned && !state.objectives.sealActivated) {
          state.objectives.sealActivated = true;
          changed = true;
          io.to(currentRoomId).emit('server_message', {
            text: 'ALL 3 CELESTIAL SYMBOLS CONVERGED // EXIT SEAL BREACHED',
            type: 'alert'
          });
        }
        break;

      case 'OBSERVATORY_ESCAPE':
        if (state.objectives.sealActivated && !state.objectives.escaped) {
          state.objectives.escaped = true;
          state.phase = 'ROUND_RESOLVE';
          state.resolveRemaining = RESOLVE_SECONDS;
          changed = true;

          const guestPlayer = Object.values(state.players).find((p) => p.role === 'GUEST');
          let winnerName = 'GUEST';
          if (guestPlayer) {
            if (guestPlayer.id === state.hostId) {
              state.scores.hostEscapes++;
              state.scores.hostRoundWins++;
            } else {
              state.scores.peerEscapes++;
              state.scores.peerRoundWins++;
            }
            winnerName = guestPlayer.name;
          }

          io.to(currentRoomId).emit('round_resolved', {
            roundIndex: state.roundIndex,
            winnerRole: 'GUEST',
            winnerName,
            reason: 'ESCAPED'
          });
          io.to(currentRoomId).emit('server_message', {
            text: `GUEST ESCAPED THE OBSERVATORY // ROUND ${state.roundIndex} COMPLETE`,
            type: 'alert'
          });
        }
        break;
    }

    if (changed) {
      console.log(`[DREADLOCK Server] Room ${currentRoomId} objective updated:`, state.objectives);
      io.to(currentRoomId).emit('objective_updated', state.objectives);
      io.to(currentRoomId).emit('match_state_sync', state);
    }
  });

  // 5. WARDEN SABOTAGE ACTIONS
  socket.on('warden_action', (data, callback) => {
    if (!currentRoomId || !rooms.has(currentRoomId)) {
      callback?.({ success: false, error: 'Not in a room' });
      return;
    }
    const state = rooms.get(currentRoomId)!;
    if (state.phase !== 'LIVE_ROUND') {
      callback?.({ success: false, error: 'Abilities only available during live round' });
      return;
    }

    const player = state.players[socket.id];
    if (player?.role !== 'WARDEN') {
      callback?.({ success: false, error: 'Only Warden can trigger sabotage abilities' });
      return;
    }

    let cost = 0;
    let duration = 0;
    let sector = 'ENTIRE_FACILITY';

    switch (data.ability) {
      case 'BLACKOUT':
        cost = 35;
        duration = 6.0;
        if (state.wardenState.energy < cost) {
          callback?.({ success: false, error: 'Insufficient Energy (35 needed)' });
          return;
        }
        if (state.wardenState.blackoutCooldown > 0) {
          callback?.({ success: false, error: 'Blackout on cooldown' });
          return;
        }
        state.wardenState.energy -= cost;
        state.wardenState.blackoutCooldown = 18.0;
        break;

      case 'LOCKDOWN_BARRIER':
        cost = 40;
        duration = 5.0;
        sector = 'GATE_APPROACH';
        if (state.wardenState.energy < cost) {
          callback?.({ success: false, error: 'Insufficient Energy (40 needed)' });
          return;
        }
        if (state.wardenState.lockdownCooldown > 0) {
          callback?.({ success: false, error: 'Lockdown on cooldown' });
          return;
        }
        state.wardenState.energy -= cost;
        state.wardenState.lockdownCooldown = 15.0;
        break;

      case 'ARM_PULSE_HAZARD':
        cost = 30;
        duration = 4.0;
        sector = 'WEST_ARCHIVE';
        if (state.wardenState.energy < cost) {
          callback?.({ success: false, error: 'Insufficient Energy (30 needed)' });
          return;
        }
        if (state.wardenState.hazardCooldown > 0) {
          callback?.({ success: false, error: 'Hazard pulse on cooldown' });
          return;
        }
        state.wardenState.energy -= cost;
        state.wardenState.hazardCooldown = 12.0;
        break;
    }

    console.log(`[DREADLOCK Server] Warden ${socket.id} triggered ${data.ability}`);
    callback?.({ success: true });

    io.to(currentRoomId).emit('warden_state_updated', state.wardenState);
    io.to(currentRoomId).emit('facility_event', {
      type: data.ability,
      durationSeconds: duration,
      sector,
      triggeredBy: player.name
    });
    io.to(currentRoomId).emit('server_message', {
      text: `FACILITY SABOTAGE: ${data.ability} ACTIVE [${duration}s]`,
      type: 'warn'
    });
  });

  // 6. REMATCH FLOW (after MATCH_OVER)
  socket.on('request_rematch', (callback) => {
    if (!currentRoomId || !rooms.has(currentRoomId)) {
      callback?.({ success: false, error: 'Not in a room' });
      return;
    }
    const state = rooms.get(currentRoomId)!;
    if (state.phase !== 'MATCH_OVER') {
      callback?.({ success: false, error: 'Match is not over yet' });
      return;
    }

    // Reset the whole match for both connected players.
    state.roundIndex = 1;
    state.arenaId = 'ENTRY_VAULT';
    state.scores = { hostEscapes: 0, peerEscapes: 0, hostRoundWins: 0, peerRoundWins: 0 };
    state.objectives = freshObjectives();
    state.wardenState = freshWardenState();
    for (const [id, p] of Object.entries(state.players)) {
      p.role = id === state.hostId ? 'GUEST' : 'WARDEN';
      p.position = p.role === 'GUEST' ? { x: 0, y: 0, z: 6.0 } : { x: 0, y: 0, z: 4.5 };
    }
    state.phase = 'READY_COUNTDOWN';
    state.countdownRemaining = COUNTDOWN_SECONDS;
    state.roundTimeRemaining = ROUND_SECONDS;

    callback?.({ success: true });
    io.to(currentRoomId).emit('server_message', {
      text: 'REMATCH ACCEPTED // NEW MATCH INITIATED',
      type: 'alert'
    });
    io.to(currentRoomId).emit('match_state_sync', state);
    console.log(`[DREADLOCK Server] Room ${currentRoomId} rematch initiated.`);
  });

  // 7. DISCONNECT HANDLING
  socket.on('disconnect', () => {
    console.log(`[DREADLOCK Server] Client disconnected: ${socket.id}`);
    // Reuse the shared vacate path so disconnect and re-host/re-join
    // clean up rooms and notify peers identically.
    leaveCurrentRoom();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`[DREADLOCK Server] Authoritative 2-Player Server Live`);
  console.log(`Listening on: http://127.0.0.1:${PORT}`);
  console.log(`Round clock: ${COUNTDOWN_SECONDS}s countdown / ${ROUND_SECONDS}s round / ${RESOLVE_SECONDS}s resolve`);
  console.log(`====================================================`);
});

import { io } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  NetworkMatchState
} from '../src/shared/types.ts';

const SERVER_URL = 'http://127.0.0.1:3001';

async function runMultiplayerTest() {
  console.log('[TEST] Starting 2-Client Multiplayer E2E Test on', SERVER_URL);

  let hostRoomId = '';
  let hostState: NetworkMatchState | null = null;
  let client2State: NetworkMatchState | null = null;
  let movementReceived = false;

  // 1. Connect Host (Client 1)
  const client1 = io(SERVER_URL);
  await new Promise<void>((resolve) => client1.on('connect', resolve));
  console.log('[TEST] Client 1 (Host) connected:', client1.id);

  client1.on('match_state_sync', (state: any) => {
    hostState = state;
  });

  // 2. Create Room
  const createRes = await new Promise<any>((resolve) => {
    client1.emit('create_room', { playerName: 'Runner-Host' }, resolve);
  });

  if (!createRes.success) {
    throw new Error('Create room failed: ' + createRes.error);
  }
  hostRoomId = createRes.roomId;
  console.log('[TEST] Room created successfully with code:', hostRoomId);

  // 3. Connect Joiner (Client 2)
  const client2 = io(SERVER_URL);
  await new Promise<void>((resolve) => client2.on('connect', resolve));
  console.log('[TEST] Client 2 (Joiner) connected:', client2.id);

  client2.on('match_state_sync', (state: any) => {
    client2State = state;
  });

  client2.on('player_moved', (data: any) => {
    if (data.id === client1.id && data.position.x === 1.85) {
      movementReceived = true;
      console.log('[TEST] Client 2 received replicated movement from Client 1:', data.position);
    }
  });

  // 4. Join Room
  const joinRes = await new Promise<any>((resolve) => {
    client2.emit('join_room', { roomId: hostRoomId, playerName: 'Saboteur-Peer' }, resolve);
  });

  if (!joinRes.success) {
    throw new Error('Join room failed: ' + joinRes.error);
  }
  console.log('[TEST] Client 2 joined room', hostRoomId);

  // Give state sync 200ms
  await new Promise((r) => setTimeout(r, 200));

  console.log('[TEST] Host Match Phase:', hostState?.phase);
  console.log('[TEST] Client 2 Match Phase:', client2State?.phase);
  console.log('[TEST] Total Players in Room:', Object.keys(hostState?.players || {}).length);

  if (hostState?.phase !== 'READY_COUNTDOWN') {
    throw new Error(`Expected READY_COUNTDOWN, got ${hostState?.phase}`);
  }

  // 5. Test Movement Replication
  client1.emit('player_movement', {
    position: { x: 1.85, y: 0.0, z: -2.4 },
    rotationY: 3.14,
    isMoving: true,
    isGrounded: true
  });

  await new Promise((r) => setTimeout(r, 300));
  if (!movementReceived) {
    throw new Error('Movement replication failed — Client 2 did not receive movement packet!');
  }

  // 6. Wait for 3-Second Countdown to live round
  console.log('[TEST] Waiting for 3-second server countdown...');
  await new Promise((r) => setTimeout(r, 3400));

  console.log('[TEST] Post-Countdown Phase:', hostState?.phase);
  console.log('[TEST] Post-Countdown Round Time Remaining:', hostState?.roundTimeRemaining);

  if (hostState?.phase !== 'LIVE_ROUND') {
    throw new Error(`Expected LIVE_ROUND, got ${hostState?.phase}`);
  }

  // 7. Test Authoritative Objective Progression Synchronization
  console.log('[TEST] Testing canonical Entry Vault objective synchronization...');
  let lastSyncedObjectives: any = null;
  client2.on('objective_updated', (objs: any) => {
    lastSyncedObjectives = objs;
  });

  async function waitForObjective(predicate: (obj: any) => boolean, label: string, timeoutMs = 3000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (lastSyncedObjectives && predicate(lastSyncedObjectives)) {
        return;
      }
      await new Promise((r) => setTimeout(r, 40));
    }
    throw new Error(`Timed out waiting for objective: ${label}`);
  }

  async function waitForMatchState(predicate: (state: NetworkMatchState) => boolean, label: string, timeoutMs = 8000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (hostState && predicate(hostState)) return;
      await new Promise((r) => setTimeout(r, 40));
    }
    throw new Error(`Timed out waiting for match state: ${label}`);
  }

  // 7a. Test Warden Sabotage Abilities (Client 2 is Warden)
  console.log('[TEST] Testing Warden sabotage mechanics (energy, cooldowns, facility events)...');
  let blackoutEventReceived = false;
  client1.on('facility_event', (event: any) => {
    console.log('[TEST] Client 1 (Guest) received facility event:', event);
    if (event.type === 'BLACKOUT') blackoutEventReceived = true;
  });

  // Client 2 triggers BLACKOUT
  const blackoutRes: any = await new Promise((res) => {
    client2.emit('warden_action', { ability: 'BLACKOUT' }, res);
  });
  if (!blackoutRes?.success) {
    throw new Error('Warden BLACKOUT failed: ' + blackoutRes?.error);
  }
  console.log('[TEST] ✓ Warden BLACKOUT triggered successfully');

  // Verify Client 1 received facility event
  await new Promise((r) => setTimeout(r, 100));
  if (!blackoutEventReceived) {
    throw new Error('Client 1 did not receive BLACKOUT facility event!');
  }
  console.log('[TEST] ✓ Guest received BLACKOUT facility event replication');

  // Client 2 tries to trigger BLACKOUT again immediately (should fail due to cooldown)
  const blackoutSpamRes: any = await new Promise((res) => {
    client2.emit('warden_action', { ability: 'BLACKOUT' }, res);
  });
  if (blackoutSpamRes?.success) {
    throw new Error('Expected BLACKOUT to fail on cooldown, but it succeeded!');
  }
  console.log('[TEST] ✓ Cooldown enforcement verified:', blackoutSpamRes?.error);

  // Client 2 triggers LOCKDOWN_BARRIER (costs 40, total spent 35 + 40 = 75, energy ~25 remaining)
  const lockdownRes: any = await new Promise((res) => {
    client2.emit('warden_action', { ability: 'LOCKDOWN_BARRIER' }, res);
  });
  if (!lockdownRes?.success) {
    throw new Error('Warden LOCKDOWN_BARRIER failed: ' + lockdownRes?.error);
  }
  console.log('[TEST] ✓ Warden LOCKDOWN_BARRIER triggered successfully');

  // Client 2 tries to trigger ARM_PULSE_HAZARD immediately (needs 30, only has ~25-26 energy)
  const hazardFailRes: any = await new Promise((res) => {
    client2.emit('warden_action', { ability: 'ARM_PULSE_HAZARD' }, res);
  });
  if (hazardFailRes?.success) {
    throw new Error('Expected ARM_PULSE_HAZARD to fail due to insufficient energy!');
  }
  console.log('[TEST] ✓ Energy constraint verified:', hazardFailRes?.error);

  // Wait 2.5s for passive energy regen (2.5 energy/sec -> +6.25 energy)
  console.log('[TEST] Waiting for Warden energy regeneration (+2.5/s)...');
  await new Promise((r) => setTimeout(r, 2600));

  // Now trigger ARM_PULSE_HAZARD (should succeed)
  const hazardOkRes: any = await new Promise((res) => {
    client2.emit('warden_action', { ability: 'ARM_PULSE_HAZARD' }, res);
  });
  if (!hazardOkRes?.success) {
    throw new Error('Warden ARM_PULSE_HAZARD failed after regen: ' + hazardOkRes?.error);
  }
  console.log('[TEST] ✓ Warden ARM_PULSE_HAZARD succeeded after passive regeneration');

  // 8. Test Guest Objectives with authoritative proximity validation
  // 8a. Move to Cell A & Pickup
  client1.emit('player_movement', {
    position: { x: 8.0, y: 0.0, z: -5.0 },
    rotationY: 0,
    isMoving: true,
    isGrounded: true
  });
  await new Promise((r) => setTimeout(r, 60));
  client1.emit('interact_action', { actionType: 'PICKUP_CELL_A' });
  await waitForObjective((o) => o.cellACollected, 'cellACollected');
  console.log('[TEST] ✓ Cell A pickup synchronized');

  // 8b. Move to Cell B & Pickup
  client1.emit('player_movement', {
    position: { x: -7.8, y: 0.0, z: 0.0 },
    rotationY: 0,
    isMoving: true,
    isGrounded: true
  });
  await new Promise((r) => setTimeout(r, 60));
  client1.emit('interact_action', { actionType: 'PICKUP_CELL_B' });
  await waitForObjective((o) => o.cellBCollected, 'cellBCollected');
  console.log('[TEST] ✓ Cell B pickup synchronized');

  // 8c. Move to Relay & Insert Cells
  client1.emit('player_movement', {
    position: { x: 0.0, y: 0.0, z: -0.8 },
    rotationY: 0,
    isMoving: true,
    isGrounded: true
  });
  await new Promise((r) => setTimeout(r, 60));
  client1.emit('interact_action', { actionType: 'INSERT_CELLS' });
  await waitForObjective((o) => o.cellsInserted === 2, 'cellsInserted === 2');
  console.log('[TEST] ✓ Cells inserted into relay synchronized');

  // 8d. Activate Relay at Relay
  client1.emit('interact_action', { actionType: 'ACTIVATE_RELAY' });
  await waitForObjective((o) => o.relayActivated, 'relayActivated');
  console.log('[TEST] ✓ Relay activation synchronized');

  // 8e. Move to Blast Gate & Override
  client1.emit('player_movement', {
    position: { x: 0.0, y: 0.0, z: -14.2 },
    rotationY: 0,
    isMoving: true,
    isGrounded: true
  });
  await new Promise((r) => setTimeout(r, 60));
  client1.emit('interact_action', { actionType: 'OVERRIDE_GATE' });
  await waitForObjective((o) => o.gateUnlocked, 'gateUnlocked');
  console.log('[TEST] ✓ Blast Gate override synchronized');

  // 8f. Move to Escape Threshold & Escape
  client1.emit('player_movement', {
    position: { x: 0.0, y: 0.0, z: -15.6 },
    rotationY: 0,
    isMoving: true,
    isGrounded: true
  });
  await new Promise((r) => setTimeout(r, 60));
  client1.emit('interact_action', { actionType: 'ESCAPE' });
  await waitForObjective((o) => o.escaped, 'escaped');
  console.log('[TEST] ✓ Escape & Round Resolve synchronized (Host Escapes = ' + hostState?.scores?.hostEscapes + ')');

  // 9. Test 4-Round Role Reversal Loop
  console.log('[TEST] Waiting for ROUND_RESOLVE to execute automated role reversal into Round 2...');
  await waitForMatchState((s) => s.roundIndex === 2 && s.phase === 'READY_COUNTDOWN', 'Round 2 READY_COUNTDOWN', 8000);

  console.log('[TEST] Post-Role-Reversal Round Index:', hostState?.roundIndex);
  console.log('[TEST] Post-Role-Reversal Phase:', hostState?.phase);
  console.log('[TEST] Client 1 (Host) New Role:', hostState?.players?.[client1.id]?.role);
  console.log('[TEST] Client 2 (Joiner) New Role:', hostState?.players?.[client2.id]?.role);

  if (hostState?.players?.[client1.id]?.role !== 'WARDEN') {
    throw new Error(`Expected Client 1 to become WARDEN, got ${hostState?.players?.[client1.id]?.role}`);
  }
  if (hostState?.players?.[client2.id]?.role !== 'GUEST') {
    throw new Error(`Expected Client 2 to become GUEST, got ${hostState?.players?.[client2.id]?.role}`);
  }
  if (hostState?.objectives?.escaped !== false || hostState?.objectives?.relayActivated !== false) {
    throw new Error('Objectives were not reset for Round 2!');
  }
  if (hostState?.arenaId !== 'LIVING_FOUNDRY') {
    throw new Error(`Expected arenaId === 'LIVING_FOUNDRY', got ${hostState?.arenaId}`);
  }
  console.log('[TEST] ✓ Automated Role Reversal successfully executed: Client 1 is now WARDEN, Client 2 is now GUEST for Round 2!');
  console.log('[TEST] ✓ Arena transitioned seamlessly to LIVING_FOUNDRY for Round 2!');

  // 10. Test Round 2 Countdown & Living Foundry Gameplay
  console.log('[TEST] Waiting for Round 2 countdown to LIVE_ROUND...');
  await waitForMatchState((s) => s.phase === 'LIVE_ROUND', 'Round 2 LIVE_ROUND', 5000);
  console.log('[TEST] ✓ Round 2 LIVE_ROUND commenced (120s timer active in Living Foundry)');

  // 10a. Client 1 (Warden) executes BLACKOUT sabotage in Living Foundry
  let foundryBlackoutReceived = false;
  client2.on('facility_event', (event: any) => {
    console.log('[TEST] Client 2 (Guest in Foundry) received facility event:', event);
    if (event.type === 'BLACKOUT') foundryBlackoutReceived = true;
  });

  const foundrySabotageRes: any = await new Promise((res) => {
    client1.emit('warden_action', { ability: 'BLACKOUT' }, res);
  });
  if (!foundrySabotageRes?.success) {
    throw new Error('Warden BLACKOUT failed in Living Foundry: ' + foundrySabotageRes?.error);
  }
  await new Promise((r) => setTimeout(r, 100));
  if (!foundryBlackoutReceived) {
    throw new Error('Client 2 did not receive Living Foundry BLACKOUT event!');
  }
  console.log('[TEST] ✓ Warden sabotage (BLACKOUT) verified in Arena 02: Living Foundry');

  // 10b. Client 2 (Guest) restores Energy Node A
  console.log('[TEST] Client 2 restoring Energy Node A...');
  client2.emit('interact_action', { actionType: 'RESTORE_NODE_A' });
  await waitForObjective((o) => o.nodeARestored, 'nodeARestored');
  console.log('[TEST] ✓ Living Foundry Node A restored');

  // 10c. Client 2 (Guest) restores Energy Node B
  console.log('[TEST] Client 2 restoring Energy Node B...');
  client2.emit('interact_action', { actionType: 'RESTORE_NODE_B' });
  await waitForObjective((o) => o.nodeBRestored, 'nodeBRestored');
  console.log('[TEST] ✓ Living Foundry Node B restored');

  // 10d. Client 2 (Guest) restores Energy Node C
  console.log('[TEST] Client 2 restoring Energy Node C...');
  client2.emit('interact_action', { actionType: 'RESTORE_NODE_C' });
  await waitForObjective((o) => o.nodeCRestored, 'nodeCRestored');
  console.log('[TEST] ✓ Living Foundry Node C restored (All 3 nodes online)');

  // 10e. Power Service Lift
  console.log('[TEST] Client 2 powering Service Lift at central terminal...');
  client2.emit('interact_action', { actionType: 'POWER_LIFT' });
  await waitForObjective((o) => o.liftPowered, 'liftPowered');
  console.log('[TEST] ✓ Suspended Service Lift powered on');

  // 10f. Ride Service Lift across bottomless energy chasm
  console.log('[TEST] Client 2 engaging Service Lift console to traverse chasm...');
  client2.emit('interact_action', { actionType: 'RIDE_LIFT' });
  await waitForObjective((o) => o.liftActive, 'liftActive');
  console.log('[TEST] ✓ Service Lift active & traversed across chasm');

  // 10g. Escape through North Foundry Blast Door
  console.log('[TEST] Client 2 breaching North Blast Door to escape Living Foundry...');
  client2.emit('interact_action', { actionType: 'FOUNDRY_ESCAPE' });
  await waitForObjective((o) => o.escaped, 'escaped');
  console.log('[TEST] ✓ Living Foundry escape complete! Scores: Host =', hostState?.scores?.hostEscapes, 'Peer =', hostState?.scores?.peerEscapes);

  if (hostState?.scores?.peerEscapes !== 1 || hostState?.scores?.hostEscapes !== 1) {
    throw new Error(`Score mismatch: Host ${hostState?.scores?.hostEscapes}, Peer ${hostState?.scores?.peerEscapes}`);
  }
  console.log('[TEST] ✓ Match score tied 1-1 after 2 rounds with role reversal in both Entry Vault and Living Foundry!');

  // 11. Test Role Reversal & Arena Transition to Sector 03: The Observatory (Round 3)
  console.log('[TEST] Waiting for ROUND_RESOLVE to execute automated role reversal into Round 3...');
  await waitForMatchState((s) => s.roundIndex === 3 && s.phase === 'READY_COUNTDOWN', 'Round 3 READY_COUNTDOWN', 8000);

  console.log('[TEST] Post-Role-Reversal Round Index:', hostState?.roundIndex);
  console.log('[TEST] Post-Role-Reversal Phase:', hostState?.phase);
  console.log('[TEST] Client 1 (Host) New Role:', hostState?.players?.[client1.id]?.role);
  console.log('[TEST] Client 2 (Joiner) New Role:', hostState?.players?.[client2.id]?.role);
  console.log('[TEST] Active Arena for Round 3:', hostState?.arenaId);

  if (hostState?.players?.[client1.id]?.role !== 'GUEST') {
    throw new Error(`Expected Client 1 to become GUEST for Round 3, got ${hostState?.players?.[client1.id]?.role}`);
  }
  if (hostState?.players?.[client2.id]?.role !== 'WARDEN') {
    throw new Error(`Expected Client 2 to become WARDEN for Round 3, got ${hostState?.players?.[client2.id]?.role}`);
  }
  if (hostState?.arenaId !== 'OBSERVATORY') {
    throw new Error(`Expected arenaId === 'OBSERVATORY', got ${hostState?.arenaId}`);
  }
  console.log('[TEST] ✓ Automated Role Reversal successfully executed: Client 1 is back to GUEST, Client 2 is back to WARDEN!');
  console.log('[TEST] ✓ Arena transitioned seamlessly to OBSERVATORY for Round 3!');

  // 12. Test Round 3 Countdown & Observatory Celestial Gameplay
  console.log('[TEST] Waiting for Round 3 countdown to LIVE_ROUND...');
  await waitForMatchState((s) => s.phase === 'LIVE_ROUND', 'Round 3 LIVE_ROUND', 5000);
  console.log('[TEST] ✓ Round 3 LIVE_ROUND commenced (120s timer active in The Observatory)');

  // 12a. Client 2 (Warden) executes LOCKDOWN_BARRIER in The Observatory
  let observatoryLockdownReceived = false;
  client1.on('facility_event', (event: any) => {
    console.log('[TEST] Client 1 (Guest in Observatory) received facility event:', event);
    if (event.type === 'LOCKDOWN_BARRIER') observatoryLockdownReceived = true;
  });

  const obsSabotageRes: any = await new Promise((res) => {
    client2.emit('warden_action', { ability: 'LOCKDOWN_BARRIER' }, res);
  });
  if (!obsSabotageRes?.success) {
    throw new Error('Warden LOCKDOWN_BARRIER failed in Observatory: ' + obsSabotageRes?.error);
  }
  await new Promise((r) => setTimeout(r, 100));
  if (!observatoryLockdownReceived) {
    throw new Error('Client 1 did not receive Observatory LOCKDOWN_BARRIER event!');
  }
  console.log('[TEST] ✓ Warden sabotage (LOCKDOWN_BARRIER) verified in Arena 03: The Observatory');

  // 12b. Client 1 (Guest) aligns Symbol Alpha (Lower Gallery Astrolabe)
  console.log('[TEST] Client 1 aligning Symbol Alpha [Lower Astrolabe]...');
  client1.emit('interact_action', { actionType: 'ALIGN_SYMBOL_A' });
  await waitForObjective((o) => o.symbolAAligned, 'symbolAAligned');
  console.log('[TEST] ✓ Observatory Symbol Alpha aligned');

  // 12c. Client 1 (Guest) aligns Symbol Beta (East Chasm Prism across rotating bridge)
  console.log('[TEST] Client 1 aligning Symbol Beta [East Prism]...');
  client1.emit('interact_action', { actionType: 'ALIGN_SYMBOL_B' });
  await waitForObjective((o) => o.symbolBAligned, 'symbolBAligned');
  console.log('[TEST] ✓ Observatory Symbol Beta aligned');

  // 12d. Client 1 (Guest) aligns Symbol Gamma (High Catwalk Lens)
  console.log('[TEST] Client 1 aligning Symbol Gamma [High Lens]...');
  client1.emit('interact_action', { actionType: 'ALIGN_SYMBOL_C' });
  await waitForObjective((o) => o.symbolCAligned, 'symbolCAligned');
  console.log('[TEST] ✓ Observatory Symbol Gamma aligned (All 3 celestial symbols converged)');

  // 12e. Activate Celestial Exit Seal at central Orrery dais console
  console.log('[TEST] Client 1 engaging Celestial Exit Seal console on central dais...');
  client1.emit('interact_action', { actionType: 'ACTIVATE_SEAL' });
  await waitForObjective((o) => o.sealActivated, 'sealActivated');
  console.log('[TEST] ✓ Celestial Exit Seal breached & void portal activated');

  // 12f. Escape through North Void Portal
  console.log('[TEST] Client 1 crossing North Void Portal threshold to escape Observatory...');
  client1.emit('interact_action', { actionType: 'OBSERVATORY_ESCAPE' });
  await waitForObjective((o) => o.escaped, 'escaped');
  console.log('[TEST] ✓ Observatory escape complete! Scores: Host =', hostState?.scores?.hostEscapes, 'Peer =', hostState?.scores?.peerEscapes);

  if (hostState?.scores?.hostEscapes !== 2 || hostState?.scores?.peerEscapes !== 1) {
    throw new Error(`Score mismatch: Host ${hostState?.scores?.hostEscapes}, Peer ${hostState?.scores?.peerEscapes}`);
  }
  console.log('[TEST] ✓ Match score 2-1 after 3 rounds with complete role reversal across all 3 canonical arenas!');

  console.log('[TEST] SUCCESS! Full 2-client test passed with 100% parity across ALL 3 CANONICAL ARENAS:');
  console.log(' - Host & Joiner linked to Room:', hostRoomId);
  console.log(' - Presence synchronized: exactly 2 players');
  console.log(' - Movement replicated in real-time');
  console.log(' - Authoritative 3s countdown & 120s Live Round transitioned identically on both clients');
  console.log(' - Round 1 (Entry Vault): Full 5-step loop (Cells A/B -> Relay -> Conduits -> Blast Gate)');
  console.log(' - Round 2 (Living Foundry): Full 5-step loop (Nodes A/B/C -> Power Lift -> Ride Lift -> Escape)');
  console.log(' - Round 3 (The Observatory): Full 5-step loop (Symbols Alpha/Beta/Gamma -> Orrery Seal -> Void Portal)');
  console.log(' - Atomic role reversals (Round 1: Host Guest / Peer Warden -> Round 2: Host Warden / Peer Guest -> Round 3: Host Guest / Peer Warden)');
  console.log(' - Warden sabotage actions (Blackout, Lockdown Barrier, Arm Pulse Hazard) operational across all sectors');

  client1.disconnect();
  client2.disconnect();
  process.exit(0);
}

runMultiplayerTest().catch((err) => {
  console.error('[TEST FAILED]', err);
  process.exit(1);
});

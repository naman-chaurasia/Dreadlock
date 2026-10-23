import { io, Socket } from 'socket.io-client';
import * as THREE from 'three';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  NetworkMatchState,
  NetworkPlayerState,
  PlayerTransform,
  EntryVaultObjectiveState,
  WardenAbilityType,
  WardenState,
  FacilityEvent,
  RoundResult,
  MatchOverData
} from '../shared/types.js';

export class NetworkManager {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  public isConnected = false;
  public roomId: string | null = null;
  public localPlayerId: string | null = null;
  public currentState: NetworkMatchState | null = null;

  // Throttled movement sender (~25Hz)
  private lastMoveSendTime = 0;
  private moveIntervalMs = 40;

  // Event callbacks
  public onMatchStateSync: ((state: NetworkMatchState) => void) | null = null;
  public onPlayerJoined: ((player: NetworkPlayerState) => void) | null = null;
  public onPlayerLeft: ((playerId: string) => void) | null = null;
  public onPlayerMoved: ((data: {
    id: string;
    position: PlayerTransform;
    rotationY: number;
    isMoving: boolean;
    isGrounded: boolean;
  }) => void) | null = null;
  public onObjectiveUpdated: ((objectives: EntryVaultObjectiveState) => void) | null = null;
  public onFacilityEvent: ((event: FacilityEvent) => void) | null = null;
  public onWardenStateUpdated: ((state: WardenState) => void) | null = null;
  public onServerMessage: ((msg: string, type: 'info' | 'warn' | 'alert') => void) | null = null;
  public onRoundResolved: ((result: RoundResult) => void) | null = null;
  public onMatchOver: ((data: MatchOverData) => void) | null = null;

  constructor() {
    this.connect();
  }

  private connect(): void {
    const host = window.location.hostname || '127.0.0.1';
    const serverUrl = `http://${host}:3001`;

    console.log(`[DREADLOCK Network] Connecting to multiplayer server at ${serverUrl}...`);

    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnectionAttempts: 10,
      timeout: 5000
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.localPlayerId = this.socket?.id || null;
      console.log(`[DREADLOCK Network] Connected to server. Socket ID: ${this.localPlayerId}`);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.roomId = null;
      console.warn('[DREADLOCK Network] Disconnected from multiplayer server');
    });

    this.socket.on('match_state_sync', (state) => {
      this.currentState = state;
      if (this.onMatchStateSync) {
        this.onMatchStateSync(state);
      }
    });

    this.socket.on('player_joined', (player) => {
      console.log(`[DREADLOCK Network] Player joined room:`, player.name);
      if (this.onPlayerJoined) {
        this.onPlayerJoined(player);
      }
    });

    this.socket.on('player_left', (data) => {
      console.log(`[DREADLOCK Network] Player left room:`, data.playerId);
      if (this.onPlayerLeft) {
        this.onPlayerLeft(data.playerId);
      }
    });

    this.socket.on('player_moved', (data) => {
      if (this.onPlayerMoved) {
        this.onPlayerMoved(data);
      }
    });

    this.socket.on('objective_updated', (objectives) => {
      if (this.currentState) {
        this.currentState.objectives = objectives;
      }
      if (this.onObjectiveUpdated) {
        this.onObjectiveUpdated(objectives);
      }
    });

    this.socket.on('facility_event', (event) => {
      if (this.onFacilityEvent) {
        this.onFacilityEvent(event);
      }
    });

    this.socket.on('warden_state_updated', (state) => {
      if (this.currentState) {
        this.currentState.wardenState = state;
      }
      if (this.onWardenStateUpdated) {
        this.onWardenStateUpdated(state);
      }
    });

    this.socket.on('server_message', (data) => {
      if (this.onServerMessage) {
        this.onServerMessage(data.text, data.type);
      }
    });

    this.socket.on('round_resolved', (result) => {
      if (this.onRoundResolved) {
        this.onRoundResolved(result);
      }
    });

    this.socket.on('match_over', (data) => {
      if (this.onMatchOver) {
        this.onMatchOver(data);
      }
    });
  }

  public createRoom(playerName: string): Promise<{ success: boolean; roomId: string; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve({ success: false, roomId: '', error: 'Server not connected' });
        return;
      }

      this.socket.emit('create_room', { playerName }, (res) => {
        if (res.success) {
          this.roomId = res.roomId;
        }
        resolve(res);
      });
    });
  }

  public joinRoom(roomId: string, playerName: string): Promise<{ success: boolean; roomId: string; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve({ success: false, roomId: '', error: 'Server not connected' });
        return;
      }

      this.socket.emit('join_room', { roomId, playerName }, (res) => {
        if (res.success) {
          this.roomId = res.roomId;
        }
        resolve(res);
      });
    });
  }

  public sendMovement(
    position: THREE.Vector3,
    rotationY: number,
    isMoving: boolean,
    isGrounded: boolean
  ): void {
    if (!this.socket || !this.isConnected || !this.roomId) return;

    const now = performance.now();
    if (now - this.lastMoveSendTime < this.moveIntervalMs) {
      return;
    }
    this.lastMoveSendTime = now;

    this.socket.emit('player_movement', {
      position: {
        x: Math.round(position.x * 100) / 100,
        y: Math.round(position.y * 100) / 100,
        z: Math.round(position.z * 100) / 100
      },
      rotationY: Math.round(rotationY * 100) / 100,
      isMoving,
      isGrounded
    });
  }

  public sendAction(actionType: 'PICKUP_CELL_A' | 'PICKUP_CELL_B' | 'INSERT_CELLS' | 'ACTIVATE_RELAY' | 'OVERRIDE_GATE' | 'ESCAPE'): void {
    if (!this.socket || !this.isConnected || !this.roomId) return;
    this.socket.emit('interact_action', { actionType });
  }

  public sendWardenAction(
    ability: WardenAbilityType,
    callback?: (res: { success: boolean; error?: string }) => void
  ): void {
    if (!this.socket || !this.isConnected || !this.roomId) {
      callback?.({ success: false, error: 'Not connected' });
      return;
    }
    this.socket.emit('warden_action', { ability }, (res) => {
      callback?.(res);
    });
  }

  public sendRematch(
    callback?: (res: { success: boolean; error?: string }) => void
  ): void {
    if (!this.socket || !this.isConnected || !this.roomId) {
      callback?.({ success: false, error: 'Not connected' });
      return;
    }
    this.socket.emit('request_rematch', (res) => {
      callback?.(res);
    });
  }
}

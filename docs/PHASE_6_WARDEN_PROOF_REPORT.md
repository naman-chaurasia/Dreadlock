# DREADLOCK — Phase 6: Warden Role, CCTV Surveillance Console & Facility Counterplay Proof Report
**Date:** 2026-10-23  
**Milestone:** Phase 6 — Warden CCTV Surveillance, Sabotage Abilities & 4-Round Role Reversal  
**Lead Implementation Agent:** Antigravity  
**Target Architecture:** Root Three.js Client (Vite port 5173) + Authoritative Node.js Socket.IO Server (port 3001)  
**Location:** `D:\Arcade Artificial Hackathon`  

---

## 1. Executive Summary & Scope

Phase 6 implements the complete **Warden (Saboteur)** asymmetrical gameplay role, the **CCTV Surveillance Console**, facility sabotage counterplay abilities, and the canonical **4-round automated role reversal loop** defined in the DREADLOCK GDD (Section 02/07/08).

The single-player and multiplayer Guest runner slices (movement, jumping, sprinting, collision, Power Cells A/B, Entry Relay console, sequential conduits, blast gate override, and PBR materials) remain strictly preserved and backwards-compatible. When a player is assigned or swapped into the `WARDEN` role:
1. Third-person runner controls are disabled.
2. The view shifts into an industrial CRT surveillance terminal with 4 selectable CCTV camera feeds covering key facility choke points.
3. The Warden UI displays live camera telemetry, sector labels, a timecode feed, an authoritative energy gauge (0–100), and a sabotage ability hotbar.
4. The Warden can dispatch facility sabotage counterplay (`BLACKOUT`, `LOCKDOWN_BARRIER`, `ARM_PULSE_HAZARD`) that consumes energy and triggers server-verified cooldowns and synchronized client facility events.
5. Upon round completion (escape or 120s timer expiration), the server initiates a 5-second `ROUND_RESOLVE` intermission and automatically reverses player roles, advancing from Round 1 through Round 4 until the match is resolved.

---

## 2. Implemented Architecture & Systems

### 2.1 CCTV Surveillance Console (`src/warden/WardenController.ts`)
The Warden views the facility remotely through four fixed surveillance cameras mounted at strategic tactical locations:
- **CAM 01 (`CAM_A`):** *Central Altar & Entry Relay* (`pos: [0, 6.5, -4]`, `lookAt: [0, 1.2, -14]`) — Overlooks the dual-socket altar console, central conduit junction, and runner extraction path.
- **CAM 02 (`CAM_B`):** *East Maintenance Bay* (`pos: [14, 5.0, -10]`, `lookAt: [8, 1.5, -14]`) — Overlooks Power Cell A and the heavy industrial turbine generator.
- **CAM 03 (`CAM_C`):** *West Archive Wing* (`pos: [-14, 5.0, -10]`, `lookAt: [-8, 1.5, -14]`) — Overlooks Power Cell B and the archival server monoliths.
- **CAM 04 (`CAM_D`):** *Blast Gate Threshold* (`pos: [0, 6.0, -22]`, `lookAt: [0, 2.5, -31]`) — Overlooks the escape threshold, hydraulic locking rams, and hazard perimeter.

Each camera feed features:
- Realistic motorized pan-tilt sway (`Math.sin` / `Math.cos` subtle tracking drift).
- CRT scanlines and vignette overlay with chromatic aberration styling.
- Real-time timecode (`REC [SEC]`), active camera sector name, and field-of-view framing.
- Hotkey camera selection via keys <kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd>, <kbd>4</kbd> or clickable HUD camera buttons.

### 2.2 Authoritative Sabotage Abilities & Energy System
All Warden actions are validated authoritatively on the Node.js server (`server/server.ts`):
- **Energy Regeneration:** Authoritative passive regeneration at +2.5 energy/second up to a maximum of 100 energy.
- **Facility Blackout (`BLACKOUT`):**
  - *Cost:* 35 Energy.
  - *Cooldown:* 18 seconds.
  - *Duration:* 6.0 seconds.
  - *Effect:* Plunges the entire facility into near-pitch darkness, reducing ambient lighting to 0.02 and extinguishing non-emergency lights. Verified via `Lighting.triggerBlackout(6.0)`.
- **Lockdown Barrier (`LOCKDOWN_BARRIER`):**
  - *Cost:* 40 Energy.
  - *Cooldown:* 15 seconds.
  - *Duration:* 5.0 seconds.
  - *Effect:* Deploys an emergency magnetic lockdown barrier at the Gate Approach sector, obstructing runner passage.
- **Arm Pulse Hazard (`ARM_PULSE_HAZARD`):**
  - *Cost:* 30 Energy.
  - *Cooldown:* 12 seconds.
  - *Duration:* 4.0 seconds.
  - *Effect:* Emits a high-frequency electrical pulse through West Archive conduits, slowing and disorienting the Guest runner.

### 2.3 Automated 4-Round Match Loop & Role Reversal
- In Round 1, the Room Host starts as `GUEST` (runner) and Peer Joiner starts as `WARDEN` (saboteur).
- When the Guest escapes or the 120s round timer reaches 0, the server enters `ROUND_RESOLVE` for 5.0 seconds.
- At `ROUND_RESOLVE` completion:
  - If `roundIndex < 4`: The server reverses roles (Host becomes Warden, Joiner becomes Guest), resets objective flags, resets Warden energy to 100, resets ability cooldowns, and enters a 3-second `READY_COUNTDOWN` for the next round.
  - If `roundIndex >= 4`: The server transitions to `MATCH_OVER`, evaluates cumulative escape scores (`scores.hostEscapes` vs `scores.peerEscapes`), and broadcasts the final victor.

---

## 3. Verification & Test Evidence

### 3.1 Build & Type-Check Verification
- **Command:** `npm.cmd run build`
- **Result:** **PASS (Exit code 0)**
- **Output:**
  ```
  > dreadlock@0.1.0 build
  > tsc && vite build

  vite v5.4.21 building for production...
  ✓ 53 modules transformed.
  dist/index.html                 19.47 kB │ gzip:   4.44 kB
  dist/assets/index-kheA3bhw.js  699.10 kB │ gzip: 182.64 kB
  ✓ built in 9.42s
  ```

### 3.2 Automated 2-Client E2E Multiplayer & Warden Verification
- **Test Script:** `server/test_e2e.ts` executed via `node --experimental-strip-types server/test_e2e.ts`.
- **Result:** **100% PASS**
- **Verified Steps & Authoritative Constraints:**
  1. **Room Creation & Join:** Host (Client 1) and Joiner (Client 2) linked in room `WDDA`.
  2. **Role Assignment:** Host assigned `GUEST`, Joiner assigned `WARDEN`.
  3. **Countdown & Live Round:** Authoritative 3s countdown transitioned smoothly into 120s live round.
  4. **Movement Replication:** Real-time movement packets synchronized between clients.
  5. **Warden Ability: BLACKOUT:**
     - Client 2 triggered `BLACKOUT`.
     - Server deducted 35 energy and set 18s cooldown.
     - Client 1 received `facility_event: { type: 'BLACKOUT', durationSeconds: 6, sector: 'ENTIRE_FACILITY' }`.
  6. **Cooldown Enforcement:** Client 2 immediately attempted to spam `BLACKOUT` -> Server rejected with `Blackout on cooldown`.
  7. **Warden Ability: LOCKDOWN_BARRIER:**
     - Client 2 triggered `LOCKDOWN_BARRIER` (cost 40 energy).
     - Remaining energy dropped to ~25.
  8. **Energy Constraint Enforcement:**
     - Client 2 attempted to trigger `ARM_PULSE_HAZARD` (requires 30 energy).
     - Server rejected with `Insufficient Energy (30 needed)`.
  9. **Passive Energy Regeneration:**
     - Client 2 waited 2.6 seconds (+6.5 energy regenerated at 2.5/s).
     - Client 2 re-attempted `ARM_PULSE_HAZARD` -> Server approved and broadcast `facility_event`!
  10. **Objective Progression Loop:**
      - Cell A pickup -> Synchronized.
      - Cell B pickup -> Synchronized.
      - Insert 2 cells -> Synchronized.
      - Activate relay -> Synchronized.
      - Override blast gate -> Synchronized.
      - Escape threshold -> Synchronized.
      - Host Escapes score incremented to 1.
  11. **Automated Role Reversal:**
      - Server entered `ROUND_RESOLVE` for 5 seconds.
      - Server swapped roles: Client 1 became `WARDEN`, Client 2 became `GUEST`.
      - Round index advanced to 2.
      - All objectives reset to initial state.
      - Room entered `READY_COUNTDOWN` for Round 2.

---

## 4. Key Controls & Interface

| Mode | Input | Action |
| :--- | :--- | :--- |
| **Guest** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Move runner character |
| **Guest** | <kbd>Space</kbd> / <kbd>Shift</kbd> | Jump / Sprint |
| **Guest** | <kbd>E</kbd> | Contextual interaction (Power Cells, Relay, Gate) |
| **Warden** | <kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> / <kbd>4</kbd> | Switch CCTV Feeds (Altar, East Bay, West Wing, Gate) |
| **Warden** | <kbd>Q</kbd> | Trigger Facility Blackout (Cost: 35 Energy) |
| **Warden** | <kbd>W</kbd> | Deploy Lockdown Barrier (Cost: 40 Energy) |
| **Warden** | <kbd>E</kbd> | Arm Pulse Hazard (Cost: 30 Energy) |
| **General** | <kbd>T</kbd> | Toggle Light / Dark Visibility Mode |
| **General** | <kbd>Tab</kbd> | Show/Hide Diagnostics HUD |

---

## 5. Artifacts & Documentation Updates

- **Active Source Files Modified / Added:**
  - `src/warden/WardenController.ts`: CCTV surveillance cameras, sway, telemetry, and ability inputs.
  - `src/shared/types.ts`: Warden state, facility events, 4-round match state, and role definitions.
  - `server/server.ts`: Authoritative energy regen, cooldown validation, sabotage broadcasts, and 4-round role reversal loop.
  - `server/test_e2e.ts`: Full automated multi-client E2E test verifying all Warden and Role Reversal mechanics.
  - `src/core/Engine.ts`: Dynamic controller swapping between Runner (Guest) and CCTV (Warden).
  - `src/rendering/Lighting.ts`: Added dynamic blackout lighting dimmer and recovery loop.
  - `src/network/NetworkManager.ts`: Added Warden action dispatchers and facility event hooks.
  - `index.html`: CCTV scanline overlay, camera selector buttons, energy meter, and ability hotbar.
- **Status:** **PHASE 6 COMPLETE AND EVIDENCED.**

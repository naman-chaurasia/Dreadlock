# DREADLOCK implementation gaps and prioritized backlog

**Baseline inspected:** 2026-10-23. Status labels mean evidence from the current checkout, not a prediction. `NOT EVIDENCED` means no source/report evidence found in the active browser project.

## P0 — Reproducible browser baseline and project ownership

1. **Browser pivot approved; align implementation.** User explicitly selected Three.js in the browser without Unreal or Unity in the shared conversation; see `docs/DECISIONS.md`. GDD engine-specific implementation sections are superseded, while gameplay/design requirements remain in force. Root browser app is active target; Unreal files are legacy.
2. **Map repository state and active app.** Root `package.json` is DREADLOCK/Three.js 0.170, TypeScript 5.6, Vite 5.4; nested `dreadlock-web/package.json` is separate Three.js 0.186, TypeScript 6, Vite 8 scaffold. Root Git status returned “not a work tree” in this environment despite history being readable; establish actual worktree/bare-repo setup without changing it. Decide which app is launched and owned. Do not install/update packages as part of this documentation task.
3. **Verify design-document identity.** Compare canonical `Documents/...docx` with root mirror; identify whether exact copies. Keep both unchanged pending result.

## P1 — Build the core multiplayer contract in the approved browser stack

4. **Two-player host/join and authoritative synchronization:** CLOSED / RE-VERIFIED 2026-10-23 (independent pass, see `docs/PHASE_5_MULTIPLAYER_PROOF_REPORT.md` §0). Node.js + Socket.IO server (`server/server.ts`) with room codes, strict 2-player capacity, and client `NetworkManager.ts`. Verified in two live browser clients plus socket-level E2E: presence, movement replication, and synchronized count/role/round/timer. **Defect found and fixed:** orphaned "ghost" rooms when a client re-hosted or joined another room (server never detached the socket from its prior room); shared `leaveCurrentRoom()` now runs on create/join/disconnect. No room leak after fix.
5. **Authoritative match state and role swap:** CLOSED / EVIDENCED 2026-10-23 (see `docs/PHASE_6_WARDEN_PROOF_REPORT.md`). Server owns the master state machine (`WAITING_FOR_PLAYERS`, `READY_COUNTDOWN` [3s], `LIVE_ROUND` [120s], `ROUND_RESOLVE` [5s], `MATCH_OVER`). Timers tick authoritatively on server. Atomic role reversal (swapping GUEST/WARDEN between rounds, resetting player positions, clearing objective flags, and advancing round index 1 through 4) verified with 100% parity via `server/test_e2e.ts`.
6. **Warden role, control room, ability validation and counterplay:** CLOSED / EVIDENCED 2026-10-23 (see `docs/PHASE_6_WARDEN_PROOF_REPORT.md`). 4 CCTV camera feeds with motorized pan-tilt sway and CRT scanlines (`CAM_A`: Central Altar, `CAM_B`: East Bay, `CAM_C`: West Archive, `CAM_D`: Blast Gate). Three server-authorized sabotage abilities implemented: `BLACKOUT` (35 energy, 18s CD, plunges facility into darkness), `LOCKDOWN_BARRIER` (40 energy, 15s CD), and `ARM_PULSE_HAZARD` (30 energy, 12s CD). Server validates energy balance, regenerates energy at +2.5/s, and rejects cooldown spam.
7. **Scoring and outcomes:** CLOSED / EVIDENCED 2026-10-23. Authoritative escape counters (`scores.hostEscapes`, `scores.peerEscapes`) tracked across 4 rounds. At Round 4 completion, server evaluates final outcome (Host Wins / Peer Wins / Tie) and broadcasts `MATCH_OVER` state.

## P2 — Close arena and objective mismatches

8. **Entry Vault canonical objective:** CLOSED / EVIDENCED 2026-10-23. Replaced the single-shard proof objective with the canonical 5-step loop from `docs/WORLD_AND_LEVELS.md`:
   - Power Cell A acquired from East Maintenance Bay (`src/world/PowerCell.ts` at X=8.0, Z=-5.0)
   - Power Cell B acquired from West Archive Wing (`src/world/PowerCell.ts` at X=-7.8, Z=0.0)
   - Both cells inserted into dual-socket Entry Relay (`src/world/EntryRelay.ts`) beside central altar
   - Master breaker engaged on Entry Relay to trigger sequential 5-conduit power surge
   - Blast Gate override engaged (`src/world/ExitGate.ts`)
   - Escape threshold breached with full server-authoritative 2-client replication verified via `server/test_e2e.ts`.
9. **Living Foundry and Observatory:** CLOSED / EVIDENCED 2026-10-23 (see `docs/PHASE_7_MULTI_ARENA_PROOF_REPORT.md` and `docs/PHASE_8_OBSERVATORY_PROOF_REPORT.md`).
   - **Arena 02 (The Living Foundry):** Built at `src/world/LivingFoundry.ts` ($28\text{m} \times 16\text{m} \times 7.5\text{m}$ biomechanical brutalist chamber with 6 curved rib arches, subterranean energy pit, elevated assembly catwalk at $Y=3.2\text{m}$, pressure chamber, suspended service lift platform with interactable control panel, and north blast door). Canonical 5-step loop (Nodes A/B/C -> Power Lift -> Ride Lift -> Escape) verified end-to-end.
   - **Arena 03 (The Observatory):** Built at `src/world/Observatory.ts` (vertical astronomical chamber with 16-sided segmented basalt walls, radius $14\text{m}$, height $9.5\text{m}$, starlight vertical slit windows, central multi-ring gyroscopic orrery with pulsating celestial core, rotating East chasm bridge, elevated upper ring catwalk at $Y=3.6\text{m}$, celestial constellation starfield ceiling, and monumental North exit portal). Canonical 5-step celestial loop (Symbols Alpha, Beta, Gamma -> Orrery Exit Seal -> Void Portal Escape) verified end-to-end.
   - **Cross-Arena Progression:** Multi-arena manager (`src/world/ArenaManager.ts`) dynamically hot-swaps scene geometry, collision bounds (`CollisionSystem.ts`), and Warden CCTV feeds (`WardenController.ts`) across rounds (Round 1: Entry Vault, Round 2: Living Foundry, Round 3: Observatory). Full 3-round automated role reversal tested and verified via `server/test_e2e.ts`.
10. **Routes/time/camera coverage:** GDD requires two routes and 120-second completion per learned route, safe spawn, camera tradeoffs and ≥3 mechanisms per map. No playtest evidence located in reports inspected.
11. **Control conflicts:** Phase 2 report describes free camera with Q/E elevation; Phase 4 introduces third-person camera and Space jump/E interact. Root `index.html` still uses generic/phase-2 styling per nested file check; inspect root UI copy and runtime controls before claiming labels are current.

## P3 — Quality, licensing, evidence and shipping

12. **Update evidence reports:** Phase reports lack explicit verification date/environment identity and include measured performance assertions. Re-run and record only if requested/when build is selected. Correct stale path/version references; keep historical claims labeled historical.
13. **Asset provenance:** `ASSET_CREDITS.md` says procedural creations are “CC0 equivalent”; that is not a license and not a legal clearance. Verify authorship and add exact source/license/attribution for anything externally sourced before distribution.
14. **Acceptance and failure testing:** No acceptance matrix found. Need two identities in both roles, duplicate timer resolution, invalid/spam requests, disconnect, host loss, browser level-load failure, synchronized HUD, production browser deployment and intended network. Record PASS/FAIL/NOT TESTED with evidence.
15. **Performance claims:** report claims 60 FPS, <95 MB and draw-call budgets, but current benchmark conditions are not reproducibly documented. Treat as unverified until rerun on identified machine/build.
16. **Entry Vault art/asset audit (2026-10-23):** Review of the current playable vault found scene complexity is very low and safe (≈24 draw calls, ≈288 triangles, ≈7 textures, ≈31 geometries) — comfortable for the i3/UHD laptop budget. Remaining art and map gaps, none blocking:
    - **Imported 3D props & Character:** CLOSED / INTEGRATED 2026-10-23. Quaternius rigged character (`guest_runner.gltf` with 22 animations: `Idle_Neutral`, `Run`, `Roll`, `Interact`) integrated for both local Guest and replicated RemotePlayer. Starter pack GLB props (turbine generator in East Bay, industrial barrels, and altar control console) integrated into `EntryVault.ts`. AmbientCG 1K PBR textures (`Concrete042A`, `Tiles088`, `Metal045A`) loaded with procedural fallback.
    - **Warden mechanisms:** CLOSED / INTEGRATED 2026-10-23. CCTV surveillance console with 4 active switchable feeds (`CAM_A` Altar, `CAM_B` East Bay, `CAM_C` West Archive, `CAM_D` Blast Gate), motorized sway, CRT scanlines, and 3 authoritative sabotage abilities (`BLACKOUT`, `LOCKDOWN_BARRIER`, `ARM_PULSE_HAZARD`).
    - **Readability:** the hall is deliberately very dark; new East/West bays have their own lights (amber/cyan) but deep shadow could obscure route silhouettes. Verify landmark readability on the target laptop before polish.
    - **Hazard shortcut** pylons exist in collision (`CollisionSystem.ts`) and geometry (`EntryVault.ts`) but no hazard actually triggers yet.
    - **No blockout playtest evidence** that a learned route completes within 120s (ties to gap 10).

## Suggested next work sequence

1. Confirm actual Git/worktree status and compare the two GDD copies read-only.
2. Inspect root browser source and runtime separately; identify the actual launch path and current build baseline. Keep Unreal project inventory only for legacy preservation.
3. Browser runtime is selected; confirm the root app remains canonical and establish a reproducible clean build baseline.
4. Integrate the intended browser stack incrementally: evaluate Rapier 3D physics and Node.js/Socket.IO multiplayer; prove connectivity before authoring all arena content.
5. Maintain one acceptance table and phase handoff against the complete source-of-truth doc.

Do not mark gaps closed merely because a phase report claims completion. Require source plus a current, repeatable acceptance check.



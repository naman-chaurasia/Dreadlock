# DREADLOCK project source of truth

**Status:** working context baseline, updated 2026-10-23. The user-approved browser platform direction is recorded in `docs/DECISIONS.md`. This document organizes the supplied GDD and observed checkout.

## Canonical references and authority

1. **Design intent:** `Documents/DREADLOCK_Game_Concept_and_Working_Document.docx` (also mirrored at repository root); concept v1.0, dated 23 Oct 2026. If copies differ, compare and ask the owner; do not silently pick a changed copy. `extracted_concept.txt` is a derived text convenience, not the canonical document.
2. **Current implementation facts:** inspect source/project files in the selected runtime. Reports under `docs/` are historical evidence snapshots, not proof of current state.
3. **Approved changes:** `docs/DECISIONS.md`. The latest explicitly approved decision overrides conflicting GDD implementation assumptions only within its stated scope.
4. **Agent routing and boundaries:** root `AGENTS.md` and `docs/PROJECT_MAP.md`.

Unknown or conflicting requirements stay marked **OPEN**. Agents must not fill them with guesses.

## Project vision and scope

DREADLOCK is an asymmetric 1v1 supernatural horror/strategy/arcade game: one player is the physical **Guest / Runner**, the other the remote **Warden / Saboteur**. Every 120 seconds their roles switch. The building is the weapon: readable doors, lights, lifts, hazards and power routing create tactical choices. Horror is oppressive and supernatural without requiring gore; warnings and counterplay preserve fairness. Intended demo: compact playable vertical slice for a 24-hour hackathon, not an open world.

The GDD originally called for a **PC prototype in Unreal Engine**, but the user later explicitly approved building directly for the browser with Three.js and without Unreal or Unity in the shared conversation `https://chatgpt.com/share/6adb3aea-ad08-83e8-b8fb-cf01589b3b45`. This approved pivot is recorded in `docs/DECISIONS.md`; it supersedes the GDD engine assumption. Browser Three.js is the selected product runtime. Preserve `Game Code/` as legacy reference only; do not extend it as the active game. Do not claim unimplemented GDD gameplay is already present. PlayCanvas is strictly permitted as an engineering/asset reference only (see `docs/ASSET_SOURCES.md`); engine migration to PlayCanvas is prohibited.

## Match contract (GDD target, not current browser implementation)

- Exactly two human players; online host/join is target. Session provider and public-network capability are OPEN pending project/plugin discovery.
- Four rounds, each exactly 120 seconds of server-owned role time; two Guest rounds and two Warden rounds per player. Roles alternate atomically at boundaries.
- Arena sequence: Entry Vault, Living Foundry, Observatory, then one arena repeats (selection rule OPEN).
- Flow: ready check → 3-second countdown → live round → resolve/lock result → role transfer and arena reset/load → next countdown → results. A completed exit locks the round win while remaining time may allow optional bonus actions.
- Most round wins wins; total score breaks a tie; remaining tie uses 60-second sudden death. Disconnect/host-loss rules are specified in the GDD; implement only after authoritative match flow exists.
- Guest wins by completing the required objective and exiting before time expires. Warden wins by keeping the objective incomplete at timeout. No instant-kill sabotage in prototype.

## Roles and mechanics

**Guest:** third-person movement, jump, interaction, objective clues, route choices; cannot disable every system. Read cues, choose a route, complete objectives, counter hazards.

**Warden:** fixed surveillance/control-room viewpoint; camera feeds, door locks, lights, traps, power rerouting; cannot roam the arena or attack directly. Starts with 100 energy, suggested costs Lockdown 25, Blackout 35, Trap 30, Reroute 40; recover 10 every 20 seconds, cap 100. Each action also needs visible cooldown. These are provisional tuning values, not validated balance.

**Fairness:** every sabotage action creates a readable, avoidable problem. Give warning light/audio and wind-up plus a counter-route; emergency visibility survives blackout; do not seal every route; validate targets, energy and cooldown. Provide visual equivalents for essential sound cues. Cap Warden disruption points at 30 per round.

**Guest objective contract:** three steps: locate component, restore node, activate exit relay. Interactions are server validated by role, distance, round and actor state. At least three functional mechanisms per arena or three unique mechanisms across game; target is three per arena.

## Arena plan and level design

The detailed canonical layouts, objective chains, routes, Warden camera choices, mechanism counterplay, starter-asset placement, and build order are in `docs/WORLD_AND_LEVELS.md`. Agents must read it before changing levels or importing level assets.

Each stage uses a compact loop, safe spawn, central objective, alternate route, final exit, at least two viable routes, three functional mechanisms, readable landmarks, and Warden camera tradeoffs. Block out gameplay before art polish. Time each route against the 120-second window. No spawn may guarantee an immediate trap.

| Arena | Identity | Guest objective | Example Warden mechanisms |
|---|---|---|---|
| Entry Vault | Monumental stone/metal gate, glyphs, low amber light | Find two power shards and activate entry relay | Sliding gate, light grid, floor pulse trap |
| Living Foundry | Ancient machinery fused with organic forms, teal energy | Reroute power through three nodes to open service lift | Moving platform, energy conduit, pressure vent |
| Observatory | Vertical chamber, rotating rings, false stars beyond sealed ceiling | Align three symbols and activate exit seal | Rotating bridge, door locks, darkness pulse |

**Arenas status:** All three canonical arenas (Sector 01: Entry Vault, Sector 02: Living Foundry, Sector 03: The Observatory) are fully implemented as playable source levels (`src/world/EntryVault.ts`, `src/world/LivingFoundry.ts`, `src/world/Observatory.ts`) and dynamically orchestrated by `src/world/ArenaManager.ts` across the 4-round match rotation with server-authoritative objective parity and role reversal verified via `server/test_e2e.ts`.

## Art, environment, audio, and asset policy

- Architecture: monumental geometric stone, black metal, impossible angles, repeated glyphs. Palette: charcoal, cold blue/teal energy, restrained amber warnings. Deep shadow must preserve silhouette and threat readability. Use subtle distortions and short shifts; avoid expensive full-screen effects.
- Functional industrial UI with clear hierarchy; avoid obscuring movement. Guest sees timer/objectives/prompts/warnings/role transfer. Warden sees labeled camera feeds, mechanism states, energy/cooldowns/target and rejection reasons.
- Prioritize distinct role-switch, lock, trap-armed, objective, timer-warning and result cues. Ambient drone must not mask critical sounds.
- `docs/ASSET_CREDITS.md` lists procedural assets attributed as custom procedural / “CC0 equivalent” and optional external reference sites. Procedural authorship is plausible but “CC0 equivalent” is not a legal license grant; verify ownership before distribution. Reference sites are not proof that their assets were used or that a particular asset is licensed. Record each shipped external asset, source URL, creator, exact license/version, modifications, and required attribution. Prefer original/procedural assets while the ledger is incomplete.
- Browser proof art currently uses procedural Three.js geometry/materials and Web Audio according to source/reports. Unreal content includes `.uasset`/`.umap`; keep them as legacy reference only; do not assume cross-runtime assets are directly reusable.

## Technical architecture target (browser)

The approved stack direction from the shared conversation is Three.js + TypeScript, Vite for browser development, Rapier 3D for character physics, Node.js + Socket.IO for multiplayer, Blender with imported GLB/GLTF models, Three.js shaders/post-processing for visual effects, and Web Audio API plus properly licensed audio. This is the intended stack, not a claim that each component is already integrated. Before adding dependencies, inspect the root app and document a minimal integration plan. The current root package only confirms Three.js, TypeScript, and Vite; Rapier, Socket.IO, Blender asset pipeline, and multiplayer server are not evidenced as integrated in that root app. The GDD's Unreal classes are superseded by these browser-side responsibility boundaries:

- **Browser client:** Three.js scene/rendering, local input, camera, audio, visual effects, and presentation of replicated game state.
- **Physics:** evaluate Rapier 3D for character and mechanism collision; authority for consequential outcomes belongs on the server.
- **Game server:** Node.js + Socket.IO authoritative multiplayer server implemented at `server/server.ts` (listening on port 3001, tick rate 20Hz). It manages 2-player room lifecycles (`create_room`, `join_room`), authoritative match state machine (`WAITING_FOR_PLAYERS`, `READY_COUNTDOWN` [3s], `LIVE_ROUND` [120s], `ROUND_RESOLVE` [5s], `MATCH_OVER`), player presence, movement relay, objective synchronization, Warden energy (regeneration +2.5/s, maximum 100) and ability validation (`BLACKOUT`, `LOCKDOWN_BARRIER`, `ARM_PULSE_HAZARD`), and automated 4-round role reversal.
- **Client state:** each client sends intent, interaction requests, and local transform updates (`player_movement`), never deciding match outcomes. Server validates 2-player capacity, ticks the master countdown and 120s clock, arbitrates ability energy and cooldowns, and broadcasts synchronized match state (`match_state_sync`), peer movements (`player_moved`), facility events (`facility_event`), and objective progress (`objective_updated`) to room members.
- **Session flow:** 4-letter room codes, host/join flow, automatic ready countdown upon 2nd player arrival, disconnect cleanup returning room to waiting state, and 4-round match progression with atomic role swap at each round boundary.
- **Warden console:** Fixed CCTV surveillance terminal with 4 switchable camera feeds (`CAM_A` Altar, `CAM_B` East Bay, `CAM_C` West Archive, `CAM_D` Blast Gate), motorized sway, CRT scanline overlay, real-time energy telemetry, and ability hotbar.
- **Match state:** server-owned 3-second countdown, 120-second live round timer, 5-second round resolution with role reversal, and 4-round match culmination synchronized across both connected clients.
- **Assets:** Quaternius rigged character (`guest_runner.gltf` with 22 skeletal animations) for local runner and peer avatar, AmbientCG 1K PBR textures (`Concrete042A`, `Tiles088`, `Metal045A`), and starter pack GLB props (turbine generator, industrial barrels, control console) integrated via Three.js `AssetLoader`.
- **Validation:** automated 2-client end-to-end integration verified (`server/test_e2e.ts`) confirming room creation, peer joining, 2-player presence synchronization, real-time movement replication, Warden sabotage triggering and cooldown/energy enforcement, facility blackout dimming, canonical Entry Vault objective loop parity, and automated 4-round role reversal.
**Browser implementation (observed):** root `package.json` uses Three.js 0.170, TypeScript 5.6, Vite 5.4, Socket.IO 4.8; root `src/core/Engine.ts` orchestrates the browser render loop with dynamic controller swapping between `GuestCharacter` / `ThirdPersonCamera` and `WardenController` (CCTV surveillance). Server runtime operates via `server/server.ts` (`npm run server`). `dreadlock-web/` remains a separate nested scaffold and is not used. Root app is the selected active target.

## Controls

**Guest (Runner):**
- <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>: Run/strafe
- <kbd>Space</kbd>: Jump
- <kbd>Shift</kbd>: Sprint
- <kbd>E</kbd>: Context-sensitive interaction (Power Cells A/B, Entry Relay, Blast Gate)
- Mouse Orbit: Third-person camera look and zoom

**Warden (Saboteur):**
- <kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> / <kbd>4</kbd>: Switch CCTV Feeds (Altar, East Bay, West Wing, Gate)
- <kbd>Q</kbd>: Trigger Facility Blackout (Cost: 35 Energy)
- <kbd>W</kbd>: Deploy Lockdown Barrier (Cost: 40 Energy)
- <kbd>E</kbd>: Arm Pulse Hazard (Cost: 30 Energy)

**General:**
- <kbd>T</kbd>: Toggle High-Visibility Light / Atmospheric Dark Mode
- <kbd>Tab</kbd>: Toggle Diagnostics HUD

## Roadmap / phase gates

Phases are exit criteria, not isolated prompts. Each agent must read this complete source, prior decisions, and current status before acting; each phase carries forward the whole game context and updates this baseline.

1. **Browser baseline:** establish root app launch/build behavior, browser support, project state, and server deployment options. Exit: reproducible baseline for the approved browser runtime.
2. **Network proof:** two independent instances connect and observe replicated movement. Exit: documented host/join and transport limits.
3. **Authoritative match spine:** ready/countdown, server timer, role state, atomic swap, round result. Exit: both peers agree through at least two rounds.
4. **One complete arena loop:** Guest objective and three Warden mechanisms with server validation/counterplay. Exit: each role can act, read state, and round resolves correctly.
5. **Three blockout arenas:** reusable actors, routes, mechanisms, cameras; each playtested in 120 seconds. Exit: all three playable, not one polished map plus placeholders.
6. **UI/audio/fairness:** role HUD, warning/counterplay, accessible cues, cooldowns/energy. Exit: players understand objective/action state.
7. **Package and acceptance:** package, two-PC intended network test, 4-round match, failure cases, judge rehearsal. Exit: acceptance matrix updated PASS/FAIL/NOT TESTED with evidence.

The browser app is the selected product runtime. The Unreal project remains legacy. Do not make a roadmap phase imply unrealized multiplayer, Warden, or arena features exist.

## Acceptance criteria (target game)

- Two separate clients host/join; observe the same Guest/Warden role, round, timer and mechanism/objective states.
- Server timer lasts exactly 120 role seconds; one atomic swap and one score resolution per boundary.
- Four rounds give each player two Guest and two Warden rounds; results use round wins, score tiebreak and specified sudden death.
- Entry Vault has two shard pickups and relay; each of Foundry and Observatory has its specified objective, ≥3 working mechanisms and ≥2 routes; each learned route is completable within 120s.
- Warden actions pass role/target/energy/cooldown/range/phase checks; visible cues and counterplay; no instant-kill prototype actions or route-wide lockout.
- Guest HUD and Warden console communicate phase, remaining time, objective/target, cooldown/resource and rejected action reason; critical sound cues have visual counterparts.
- Test both player identities in both roles, repeated interaction, timer expiry, objective completion, disconnect, host loss, failed map load, HUD refresh and packaged two-PC session.
- Each check is recorded `PASS`, `FAIL`, or `NOT TESTED`, with date, build/runtime, machine/network, steps and evidence. Historical report claims are not current acceptance results.

## Current evidence limits

`docs/PHASE_2_GRAPHICS_PROOF_REPORT.md` and `docs/PHASE_4_GAMEPLAY_PROOF_REPORT.md` claim browser rendering/build/runtime checks and resource measurements. They are dated historical snapshots without a visible report date and refer to root paths/package versions; later source and nested scaffold now make parts ambiguous. Treat numeric FPS/memory/performance claims as unverified until reproduced. The Phase 4 report's “complete interactive single-player gameplay loop” is consistent with a local Guest slice, not the GDD's two-player match loop. `docs/ASSET_CREDITS.md` describes the procedural ledger; audit every distribution asset before release.




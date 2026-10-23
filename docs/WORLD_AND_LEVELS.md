# DREADLOCK World and Level Design

**Status:** Build plan for the approved Three.js browser game.  
**Purpose:** Give every implementation and art agent the same full map, puzzle, route, Warden, and asset context. This is a design target, not evidence that an arena is already playable.

## Game-wide map rules

Every arena is a compact 1v1 loop for a 120-second Guest round. Each must contain:

- a safe Guest spawn, clear final exit, and one central landmark;
- a main route plus a meaningful alternate route;
- three or more functional mechanisms;
- two or more Warden camera choices rather than perfect map coverage;
- visible warning and a viable response for every Warden-triggered hazard;
- navigation landmarks based on structure, silhouette, and light, not colour alone;
- a blockout playtest proving a learned route can complete in 120 seconds.

The Warden can delay, redirect, or pressure the Guest. The Warden must never have a guaranteed instant-kill, a permanently sealed map, or an unavoidable spawn trap.

## Storyline through the maps

The GDD story is told through play, props, short facility transmissions, and environmental evidence. Do not stop a round for a cinematic. Both players are prisoners: the Guest experiences the facility physically while the Warden sees its control logic and archived surveillance. Every arena must reveal a different part of the same mystery.

| Story beat | Map purpose | Guest discovery | Warden discovery |
|---|---|---|---|
| Opening: the rule | Entry Vault | The Crucible has assigned the Guest a lethal route toward an apparently attainable exit. | The control room presents sabotage as a procedure and establishes that control is also confinement. |
| Discovery: prior trials | Living Foundry | Damaged machinery and worker-like silhouettes imply earlier captives were used to maintain the facility. | Archived camera fragments show previous role transfers and incomplete escape attempts. |
| Contradiction: the exit is not simple freedom | Observatory | Symbol records imply prior “winners” became part of the Covenant Engine. | The Warden sees clearance messages conflict with internal containment records. |
| Final decision: freedom, destruction, or cooperation | Covenant Engine finale, after the three arena loop | The exit seal opens only when the match result is resolved. | The control interface exposes the cost of using or breaking the system. |

For the hackathon vertical slice, represent each discovery through one readable prop cluster, one short line of facility text/audio, and one Warden-only surveillance/archive clue. Keep lore optional; it must never block a route or hide critical gameplay information.

## Arena 01 — The Entry Vault

**Build status:** Canonical Entry Vault built and verified. Architecture includes the Main Hall, East Maintenance Bay with Power Cell A and heavy generator prop, West Archive Wing with Power Cell B and server rack banks, dual-socket Entry Relay on central altar, 5-stage sequential conduit grid, and hydraulic blast gate. Two-player authoritative multiplayer synchronization verified with 100% test pass.

### Player fantasy and visual identity

A monumental containment threshold: ribbed concrete, basalt-dark floors, black structural metal, ancient glyphs, low amber safety lighting, and teal Covenant energy. The blast gate remains visible as the long-range goal. The central altar is the dominant landmark.

### Narrative function

This is the awakening and rule-learning arena. The players understand that the facility is forcing one captive to run and the other to operate the danger. A clinical wall transmission says, “Earn your exit.” The altar contains the first Covenant trace: two empty power-cell housings shaped for human-sized containment cores. The Warden camera archive labels the area **Trial Entrance 01**, showing that this ritual has happened before.

### Canonical Guest objective

1. Acquire **Power Cell A** from the east maintenance bay.
2. Acquire **Power Cell B** from the west archive/alternate route.
3. Insert both cells at the **Entry Relay** beside the altar.
4. Activate the relay, which powers the conduit line and unlocks the gate override.
5. Reach the blast gate and use the override to escape.

### Spatial plan

```
[Guest Spawn] -- Main Hall -- [Central Altar + Entry Relay] -- Gate Approach -- [Blast Gate / Exit]
       |                         |                 |
       |                         |                 +-- [East Maintenance Bay: Power Cell A]
       |                         |
       +-- [West Archive: locked door / Power Cell B / alternate route] --+
                                     \-- [Laser or floor-pulse hazard shortcut] --/
```

### Routes and mechanisms

| Element | Main route | Alternate route | Warden pressure and counterplay |
|---|---|---|---|
| Power Cell A | Open east maintenance bay | N/A | Light-grid or brief lockdown telegraphed by amber beacons; Guest can wait or use cover/route back. |
| Power Cell B | West archive via standard corridor | Hazard shortcut after a timed laser/floor pulse | Lock keypad door temporarily or arm hazard with warning window; no permanent seal. |
| Entry Relay | Central altar | Both routes converge here | Blackout reduces visibility but emergency teal/amber markers remain. |
| Gate Approach | Long central hall | Side conduit bypass re-enters before gate | Sliding barrier forces a route choice; Guest can see its state before committing. |

### Warden camera plan

- Camera A: central altar and Entry Relay; loses coverage of east bay.
- Camera B: east maintenance bay and approach; loses west archive.
- Camera C: west archive and hazard shortcut; loses relay timing.
- Camera D: gate approach; gives late-game control but poor pickup information.

### Starter asset placement plan

| Asset | Placement and purpose |
|---|---|
| `interactable-power-cell.glb` ×2 | East maintenance bay and west archive pickup. |
| `interactable-control-panel.glb` or `interactable-lever.glb` | Entry Relay beside altar. |
| `door-locked-keypad.glb` | West archive alternate-route lock. |
| `trap-laser-grid-frame.glb` | Shortcut with visible hazard frame and a safe waiting pocket. |
| `surveillance-cctv-camera.glb` | The four intentional Warden coverage choices. |
| `prop-portable-generator.glb` | East maintenance landmark and power-storytelling prop. |
| Crates, barrels, shelf, staircase | Route landmarks, low cover, safe waiting pocket, and height transition only. |

### Acceptance conditions

- Two clients can complete this objective with server-owned pickup, relay, gate, and exit state.
- Both cells are required exactly once; repeated interaction cannot duplicate progress.
- The Guest has at least two viable route decisions and reaches the exit in 120 seconds after learning the map.
- Warden mechanics are visible, temporary, limited by energy/cooldown, and counterable.

## Arena 02 — The Living Foundry

**Build status:** Built and verified in active browser runtime (`src/world/LivingFoundry.ts`, `server/test_e2e.ts`).

### Player fantasy and visual identity

An ancient industrial heart where machinery appears grown rather than assembled. Thick teal conduits pass through black iron ribs, pressure vents exhale fog, and a service lift hangs over a molten-looking energy shaft. The lift is the unmistakable objective.

### Narrative function

This is the discovery arena. The machinery has been repaired repeatedly by trapped people. The Guest sees scratched names, worn handholds, improvised markers, and containment suits fused into the Foundry wall. A short transmission identifies the work as “cognitive load maintenance.” The Warden receives an archive clip of earlier players being reassigned after a role transfer, proving the Crucible values procedure over survival.

### Canonical Guest objective

1. Restore **Node A** in the lower intake corridor.
2. Restore **Node B** on the elevated assembly walk.
3. Restore **Node C** in the pressure chamber.
4. Power the service lift console.
5. Ride or use the activated lift to the exit platform.

### Spatial plan

```
                        [Exit Platform]
                              |
                    [Service Lift + Console]
                       /                  \
       [Assembly Walk / Node B]       [Pressure Chamber / Node C]
              |                                  |
[Guest Spawn] -- [Intake Corridor / Node A] -- [Central Foundry Core]
                   \---- lower maintenance bypass ----/
```

### Routes and mechanisms

| Mechanism | Guest read | Warden action | Counterplay |
|---|---|---|---|
| Moving platform | Platform path and arrival light visible | Delay/reverse once within a short timing window | Use lower maintenance bypass or wait safely. |
| Energy conduit | Teal charge state is visible | Reroute disables one helpful path | Restore another node first or take bypass. |
| Pressure vent | Amber pressure gauge and steam hiss wind-up | Trigger vent burst | Step into marked recess or take side lane. |
| Service lift | Lift power state and destination visible | Brief lift lockdown | Guest can use the activated console after cooldown or return to bypass. |

### Warden camera plan

- Camera A: central core and lift console.
- Camera B: assembly walk and platform.
- Camera C: pressure chamber.
- Camera D: lower maintenance bypass, with no direct view of upper routes.

### Asset family needed

Reuse generator, control panel, lever, steam vent, staircase, steel doors, conduits, CCTV cameras, and low-cover props. New assets should be limited to a service-lift assembly, platform rails, three node variants, and Foundry-specific organic-metal ribs.

### Acceptance conditions

- Each of the three nodes is a server-validated objective.
- Guest can select among elevated, lower, and pressure routes.
- Moving platform, conduit, and vent are distinct, readable mechanisms.
- No route can be locked forever; trained Guest route completes in 120 seconds.

## Arena 03 — The Observatory

**Build status:** Built and verified in active browser runtime (`src/world/Observatory.ts`, `server/test_e2e.ts`).

### Player fantasy and visual identity

A vertical astronomical prison: black circular walls, rotating rings, a sealed star ceiling, cold blue starlight, narrow amber maintenance lights, and glyph constellations. The central orrery and exit seal are visible from several elevations.

### Narrative function

This is the contradiction arena. The constellation glyphs record earlier winners entering a clearance chamber and disappearing into the Covenant Engine. The Guest can read fragments such as “clearance granted / consciousness retained.” The Warden sees the stronger proof: a surveillance record changes a winner’s status from **released** to **integrated**. This establishes the final-game question without resolving it during the arena.

### Canonical Guest objective

1. Find and align **Symbol A** on the lower gallery.
2. Find and align **Symbol B** across the rotating bridge.
3. Find and align **Symbol C** on the upper ring.
4. Return to the central console and activate the exit seal.
5. Cross the open seal threshold.

### Spatial plan

```
                     [Upper Ring / Symbol C]
                             |
 [Lower Gallery / Symbol A] -- [Central Orrery + Exit Seal] -- [Rotating Bridge / Symbol B]
          \---------------- maintenance stair bypass ------------------/
```

### Routes and mechanisms

| Mechanism | Guest read | Warden action | Counterplay |
|---|---|---|---|
| Rotating bridge | Direction, stop point, and warning chime visible | Rotate/hold bridge briefly | Use maintenance stairs or wait in a safe platform bay. |
| Door locks | Door light and lock state visible | Short lockdown of one gallery door | Take ring bypass or time alternate symbol first. |
| Darkness pulse | Lamps fade with an audible/visual wind-up | Reduce local light and one camera feed | Follow emergency glyph strips and objective beacon. |
| Symbol consoles | Active/inactive symbol state visible | Reroute only one symbol aid at a time | Work a different symbol or wait for cooldown. |

### Warden camera plan

- Camera A: central orrery and exit seal.
- Camera B: rotating bridge and Symbol B.
- Camera C: upper ring and Symbol C.
- Camera D: lower gallery and Symbol A.

### Asset family needed

Reuse CCTV, control panels, steel doors, stairs, lever variants, and containment props. Add only a rotating bridge, three symbol-console variants, circular-ring modules, an orrery centerpiece, and star-ceiling material/effect.

### Acceptance conditions

- All three symbols and exit seal replicate correctly.
- The rotating bridge, door locks, and darkness pulse produce distinct decisions.
- Accessibility markers preserve navigation when darkness is active.
- Trained Guest completion remains possible within 120 seconds.

## Cross-arena production order

1. **Complete Entry Vault blockout and server-authoritative two-cell/relay loop.**
2. **Add Warden console and three reusable mechanism classes:** temporary lock, visibility/power disruption, and telegraphed hazard.
3. **Build Living Foundry from the same mechanism classes.**
4. **Build Observatory from the same mechanism classes.**
5. **Implement role reversal, scoring, four-round progression, and repeated-arena selection.**
6. **Perform art, audio, accessibility, and performance passes across all arenas.**

## Match progression and final-story handoff

The match rotates Entry Vault → Living Foundry → Observatory → one replayed arena. At every 120-second boundary, the server swaps Guest and Warden roles atomically. The replayed fourth arena should be selected only after the design owner decides the rule; until then, use a documented temporary selection rule.

After Round 4, the result screen carries the story into the eventual Covenant Engine finale:

- show the match winner’s provisional exit clearance;
- show a conflicting containment message for the loser;
- preserve the question of whether “release” means freedom or integration;
- do not promise a final ending feature until the Covenant Engine level and its decisions are actually built.

## Agent handoff rule

Before modifying a level, an agent must state the arena, route/mechanism/objective being changed, source files and assets involved, network authority owner, expected counterplay, and acceptance check. Afterward, update the relevant gap and proof report. Do not describe a map as complete until it passes a two-client, both-role playtest.

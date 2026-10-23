# DREADLOCK Asset Sources, Rules & Reference Ledger

**Single Source of Truth for Assets & References**

---

## Core Rules

1. **License Priority:**  
   `CC0` > `CC-BY` (credit on Credits screen) > ask project owner.  
   **Strictly Forbidden:** Never use Non-Commercial (`NC`), Share-Alike (`SA`), `GPL`, personal-use-only, or ripped/unlicensed assets.

2. **Public Repository Protection:**  
   The repository is **PUBLIC**. Never commit files whose license forbids redistribution (raw Mixamo FBX/animation files especially). Keep raw working/download files out of git via `.gitignore` (`*.fbx`, `*.blend`, `raw_mixamo/`); ship only built/converted runtime assets (`.glb`, `.gltf`, `.ogg`, `.png`, `.jpg`).

3. **Filesystem Ground Truth:**  
   Always inspect the filesystem before assuming anything is downloaded. Never claim an asset is downloaded or integrated until the physical file exists in `public/assets/` and successfully loads in the game engine.

4. **Blocker Escalation Protocol:**  
   If configured access fails, or a download requires manual user action, add exact steps (`URL`, `license`, `target folder`, `expected filename`) to `docs/BLOCKERS.md` and immediately continue with other work.

5. **Post-Download Processing Pipeline:**  
   After download:
   - Optimize 3D meshes and textures (`gltf-transform: meshopt + KTX2`, cap textures at 1024×1024).
   - Standardize naming conventions (`kebab-case` or canonical `prop_*.glb`).
   - Retarget all character meshes to one unified humanoid skeleton.
   - Convert all audio to `.ogg` (with `.mp3` fallback if required).
   - Log the asset in `docs/ASSET_MANIFEST.md` (`Asset Name`, `Category`, `Source URL`, `License`, `File Path`, `Filesystem Verified`, `Status`).
   - Add author attribution to the in-game Credits screen modal and `docs/ASSET_CREDITS.md`.

6. **Standard Directory Layout:**  
   ```text
   public/assets/
   ├── models/            # General 3D meshes and modular environment pieces
   │   └── props/         # Interactive objects, traps, and consoles
   ├── characters/        # Rigged character models (Guest, Warden)
   ├── animations/        # Reusable skeletal animation clips (.glb)
   ├── textures/          # PBR texture sets (concrete, basalt, dark_metal)
   ├── hdri/              # Low-res environment probes / sky textures
   ├── audio/
   │   ├── sfx/           # Foley, traps, alarms, interactions (.ogg)
   │   └── music/         # Background drones and match music (.ogg)
   ├── ui/
   │   └── icons/         # HUD, ability, and interaction icons (.svg, .png)
   └── fonts/             # Monospace and technical display fonts
   ```

7. **Pre-Level Map Plans (Section H):**  
   Before building or refactoring each level, create its 2D map plan SVGs in `docs/maps/` depicting layout, landmarks, routes, hazards, and Warden camera cones.

8. **Stack Lock:**  
   Stay on the active project stack: **Three.js + TypeScript + Vite + Node/ws server**. Other engines and external editor suites (Unreal, Unity, PlayCanvas) are strictly references and must not be migrated to or installed.

---

## 0. PRE-CONFIGURED SOURCES (set up in Antigravity and Freebuff: use directly, no setup needed)
Try these FIRST. Do not ask to set them up. If access fails, mark the item BLOCKED in `docs/BLOCKERS.md` (`URL + target folder + expected filename`) and continue other work.

### 3D / animation / textures:
- **Mixamo** — https://www.mixamo.com/#/ (rigging + animations; Adobe login via configured access)  
  *CAUTION:* Fine inside the shipped game, NOT as redistributable files. Never commit raw Mixamo FBX/animation files to the public repo: keep in `.gitignore`, convert/embed into built assets only.
- **Poly Haven** — https://polyhaven.com/ (CC0 public domain models, HDRIs, and PBR textures)
- **OpenGameArt 3D** — https://opengameart.org/content/free-3d-assets (License varies PER FILE: check each one; CC0 or CC-BY only)
- **Three.js Assets** — https://threejsassets.com/assets/free (Check each asset's license before use)

### Audio:
- **Freesound** — https://freesound.org/ (CC0 filter only, unless attribution is logged and credited; never CC-BY-NC or CC-BY-SA)

### UI / HUD:
- **game-icons.net** — https://game-icons.net/ (Ability and mechanism icons; CC BY 3.0 -> credit authors on the Credits screen)
- **UI inspiration ONLY**, never copy layouts/art: `interfaceingame.com`, `garmuri.com/game_ui`, `gameui.matme.info`

### Engineering references:
- https://github.com/gamedev-skills/awesome-gamedev-agent-skills (Use skills that fit this repo's Three.js stack)
- **MDN 3D on the web** — https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web
- **PlayCanvas** — https://playcanvas.com/ (Reference and assets only; do NOT migrate engines)
  - **Allowed Use:** Technical reference for WebGL shader techniques, post-processing inspiration, camera/lighting setups, and sourcing compatible CC0/permissively licensed 3D models or textures.
  - **Prohibited:** Do NOT install the PlayCanvas engine package, do NOT rewrite game code to PlayCanvas, and do NOT migrate away from Three.js.

---

## Section A: Characters & Skeletons
- **Guest Runner (The Captive):** Humanoid jumpsuit/hazard silhouette, high contrast glowing visor. Budget: 5,000–12,000 tris. Unified humanoid rig.
- **Warden Overseer (The Saboteur):** Armored security warden / tactical overseer silhouette with amber status indicators.
- **Sources:** Quaternius Cyberpunk Character Pack (CC0), Mixamo configured access (rigging only, export to `.glb`).

---

## Section B: Skeletal Animations
- **Standard Clips Required:** `idle`, `walk`, `run`, `jump`, `interact`, `roll`, `crouch`.
- **Format:** Binary `.glb` embedded or loaded via `THREE.AnimationMixer` cross-fading.
- **Sources:** Mixamo (processed to runtime `.glb`), Quaternius Animated Character libraries (CC0).

---

## Section C: Textures & PBR Materials
- **PBR Channels:** Albedo/Diffuse, Tangent Normal (OpenGL format), Roughness, Metalness.
- **Resolution Ceiling:** 1024 × 1024 (1K max) to preserve 60 FPS on integrated laptop GPUs.
- **Themes:** Monumental Brutalist Concrete, Basalt Floor Slabs, Dark Industrial Steel, Chevron Hazard Borders.
- **Sources:** AmbientCG (CC0), Poly Haven (CC0).

---

## Section D: Environment & Interactive Props
- **Required Props:** Power cells, energy relays, industrial generators, server mainframes, surveillance CCTV camera housings, laser grid emitters, pressure steam vents, blast door rams, locked keypad doors.
- **Sources:** Kenney Space & Sci-Fi Kits (CC0), Poly Haven (CC0).

---

## Section E: Audio & Sound Effects
- **Format:** Compressed `.ogg` at 44.1 kHz, normalized volume.
- **Required Cues:** Low-frequency oppressive ambient hums, mechanical heavy door hydraulics, relay charge up, alarm sirens, Warden camera click/switch, countdown tick, role reversal stinger.
- **Sources:** Freesound (CC0 filter only; CC-BY credited), procedural Web Audio API synthesizers (`src/audio/Ambience.ts`).

---

## Section F: UI / HUD & Icons
- **Style:** Brutalist surveillance CRT / tactical terminal aesthetic. High contrast monochrome with teal `#00f0d2` (guest), amber `#ffaa22` (warden/caution), and red `#ff3333` (alarms/recording).
- **Sources:** `game-icons.net` (CC BY 3.0), custom inline SVGs.

---

## Section G: HDRI & Skyboxes
- **Format:** 1K `.hdr` / `.exr` or pre-filtered cube map textures.
- **Tone:** Dark claustrophobic vertical shaft / sealed sky ceiling with faint stellar constellations.
- **Sources:** Poly Haven (CC0).

---

## Section H: Level Map Plans & Architectural SVGs
- **Specification:** Every arena must have a corresponding technical vector map plan (`docs/maps/<arena_id>_map.svg`) before construction or major overhaul.
- **Required Layers:**
  1. Room boundaries & corridors (concrete walls, doors, stairs).
  2. Spawn points & extraction/exit blast gates.
  3. Interactive objective nodes (power cells, relays, consoles).
  4. Warden sabotage mechanisms & traps (steam vents, laser grids, light barriers).
  5. Warden surveillance camera positions with directional visual field-of-view cones.
  6. Primary routes and alternate/bypass shortcuts.

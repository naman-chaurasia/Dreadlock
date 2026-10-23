# DREADLOCK Asset Manifest

This document tracks all external, starter, and procedural assets integrated into DREADLOCK. Every asset is verified on the local filesystem before logging, along with its canonical source, license grant, relative path, and runtime status.

---

## 1. Character Models & Skeletal Rigs

| Asset Name | Category | Source URL | License | File Path | Filesystem Verified | Runtime Status |
|---|---|---|---|---|---|---|
| **Guest Runner (`guest_runner.gltf`)** | Rigged Humanoid | [Quaternius Cyberpunk Kit](https://quaternius.com/) | CC0 Public Domain | `public/assets/models/characters/guest_runner.gltf` | Verified (1.50 MB) | Active (Guest player avatar with 22 skeletal animations) |
| **Warden Overseer (`warden_overseer.glb`)** | Rigged Humanoid | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/characters/warden_overseer.glb` | Verified (27.9 KB) | Active (Warden terminal avatar silhouette) |

---

## 2. Interactive Props & Facility Traps

| Asset Name | Category | Source URL | License | File Path | Filesystem Verified | Runtime Status |
|---|---|---|---|---|---|---|
| **Door Locked Keypad** | Interactive Door | [Kenney Sci-Fi Kit](https://kenney.nl/assets/sci-fi-kit) | CC0 Public Domain | `public/assets/models/props/door-locked-keypad.glb` | Verified (3.14 KB) | Active (West Archive security lock) |
| **Door Normal Steel** | Door Frame | [Kenney Sci-Fi Kit](https://kenney.nl/assets/sci-fi-kit) | CC0 Public Domain | `public/assets/models/props/door-normal-steel.glb` | Verified (4.50 KB) | Active (Corridor threshold barrier) |
| **Staircase Segment** | Modular Arch | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/props/environment-staircase-segment.glb` | Verified (3.44 KB) | Active (Vertical level connector) |
| **Control Panel** | Interactive Console | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/props/interactable-control-panel.glb` | Verified (16.7 KB) | Active (Living Foundry node / terminal) |
| **Keycard** | Interactive Pickup | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/props/interactable-keycard.glb` | Verified (1.82 KB) | Active (Security override token) |
| **Breaker Lever** | Interactive Switch | [Kenney Sci-Fi Kit](https://kenney.nl/assets/sci-fi-kit) | CC0 Public Domain | `public/assets/models/props/interactable-lever.glb` | Verified (9.50 KB) | Active (Entry relay breaker mechanism) |
| **Interactable Power Cell** | Objective Pickup | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/props/interactable-power-cell.glb` | Verified (8.52 KB) | Active (Compact containment core) |
| **Crate Prop** | Modular Cover | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/props/prop-crate.glb` | Verified (3.17 KB) | Active (Environmental cover & landmark) |
| **Metal Barrel** | Modular Cover | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/props/prop-metal-barrel.glb` | Verified (8.48 KB) | Active (Hazard barrier / obstacle) |
| **Portable Generator** | Industrial Prop | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/props/prop-portable-generator.glb` | Verified (4.70 KB) | Active (Power storytelling landmark) |
| **Storage Shelf** | Modular Cover | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/props/prop-storage-shelf.glb` | Verified (3.15 KB) | Active (West Archive wing divider) |
| **Prop Barrels Cluster** | Prop Cluster | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/props/prop_barrels.glb` | Verified (20.8 KB) | Active (East Maintenance Bay dressing) |
| **Prop Entry Relay** | Primary Objective | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/props/prop_entry_relay.glb` | Verified (6.97 KB) | Active (Central Altar dual receptacle) |
| **Prop Generator Turbine** | Landmark Prop | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/props/prop_generator.glb` | Verified (28.0 KB) | Active (East Maintenance Bay main unit) |
| **Prop Power Cell (Large)** | Primary Objective | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/props/prop_power_cell.glb` | Verified (26.1 KB) | Active (Power Cell A & B units) |
| **Surveillance CCTV Camera** | Surveillance Hardware | [Kenney Space Kit](https://kenney.nl/assets/space-kit) | CC0 Public Domain | `public/assets/models/props/surveillance-cctv-camera.glb` | Verified (4.71 KB) | Active (Warden camera positions A/B/C/D) |
| **Laser Grid Trap Frame** | Warden Hazard | [Kenney Sci-Fi Kit](https://kenney.nl/assets/sci-fi-kit) | CC0 Public Domain | `public/assets/models/props/trap-laser-grid-frame.glb` | Verified (2.60 KB) | Active (Shortcut corridor pulse barrier) |
| **Steam Vent Trap** | Warden Hazard | [Kenney Sci-Fi Kit](https://kenney.nl/assets/sci-fi-kit) | CC0 Public Domain | `public/assets/models/props/trap-steam-vent.glb` | Verified (3.88 KB) | Active (Pressure chamber hazard burst) |

---

## 3. PBR Texture Sets (1K Resolution)

| Asset Name | Maps (Albedo, Normal, Roughness, Metalness) | Source URL | License | File Path | Filesystem Verified | Runtime Status |
|---|---|---|---|---|---|---|
| **Basalt Floor Slabs** | `albedo.jpg`, `normal.jpg`, `roughness.jpg` | [AmbientCG Tiles088](https://ambientcg.com) | CC0 Public Domain | `public/assets/textures/basalt_floor/` | Verified (4.47 MB total) | Active (Foundations & floors) |
| **Weathered Concrete** | `albedo.jpg`, `normal.jpg`, `roughness.jpg` | [AmbientCG Concrete042A](https://ambientcg.com) | CC0 Public Domain | `public/assets/textures/concrete/` | Verified (3.18 MB total) | Active (Monumental walls & pillars) |
| **Dark Industrial Metal** | `albedo.jpg`, `normal.jpg`, `roughness.jpg`, `metalness.jpg` | [AmbientCG Metal045A](https://ambientcg.com) | CC0 Public Domain | `public/assets/textures/dark_metal/` | Verified (2.32 MB total) | Active (Blast gates & structural beams) |

---

## 4. Audio Systems

| Asset Name | Category | Source | License | Implementation Path | Filesystem Verified | Runtime Status |
|---|---|---|---|---|---|---|
| **Procedural Facility Ambience** | Dynamic Soundscapes | Custom Web Audio Synthesis | CC0 Equivalent | `src/audio/Ambience.ts` | Verified | Active (55 Hz drone, resonance, alarm cues) |
| **Warden Mechanical Cues** | UI Audio | Custom Web Audio Synthesis | CC0 Equivalent | `src/audio/Ambience.ts` | Verified | Active (Lock click, blackout surge, pulse ping) |

# DREADLOCK — Asset Production, Tech Stack & Download Guide

This document defines the exact tech stack, asset requirements, polygon budgets, texture resolutions, and approved download sources for upgrading DREADLOCK to full 3D realistic visual assets and animated characters.

---

## 1. Engine & Tech Stack Architecture

| Component | Library / Engine | Status | Notes |
|---|---|---|---|
| **Core 3D Engine** | Three.js v0.170.0 | Active (`src/`) | WebGL 2.0 pipeline |
| **Model Loader** | `GLTFLoader` (`three/examples/jsm/loaders/GLTFLoader.js`) | Integrated in `src/rendering/AssetLoader.ts` | Loads `.glb` / `.gltf` with auto fallback |
| **Animation Mixer** | `THREE.AnimationMixer` & `CharacterAnimationController` | Integrated in `src/rendering/AssetLoader.ts` | Skeletal skinning with smooth cross-fading |
| **Texture Pipeline** | `THREE.TextureLoader` (sRGB / linear color spaces) | Integrated in `src/rendering/AssetLoader.ts` | PBR channels: Albedo, Normal, Roughness |
| **Physics / Collision** | Custom AABB spatial hierarchy | Integrated in `src/physics/CollisionSystem.ts` | Zero-overhead 60 FPS performance floor |

---

## 2. Hardware Budget (Intel UHD Integrated Graphics Safe)

To maintain **60 FPS** on the Core i3 development laptop:
- **Max Texture Resolution:** **1024 × 1024 (1K)**. Do not import 4K or 8K textures.
- **Character Polygon Budget:** **5,000 to 12,000 triangles** per rigged character.
- **Interactive Prop Budget:** **1,000 to 4,000 triangles** per prop.
- **File Format:** Single self-contained binary **`.glb`** with embedded textures and animations.

---

## 3. Required Character Assets

Place in: `d:\Arcade Artificial Hackathon\public\assets\models\characters\`

| Asset Name | Role | Visual Description | Required Animations | Free / CC0 Source |
|---|---|---|---|---|
| **`guest_runner.glb`** | The Captive (Runner) | Athletic humanoid in high-contrast containment jumpsuit / light hazard gear with teal glowing visor/accent. | `idle`, `walk`, `run`, `jump`, `interact` | Mixamo (Free) or Quaternius Sci-Fi Characters |
| **`warden_overseer.glb`** | The Saboteur (Warden) | Imposing armored security warden / tactical overseer silhouette with amber indicators. | `idle`, `operate_console`, `point` | Mixamo (Free) or Quaternius Sci-Fi Characters |

---

## 4. Required Realistic PBR Texture Sets (1K)

Place in: `d:\Arcade Artificial Hackathon\public\assets\textures\`

| Texture Set | Target Geometry | Required Maps (1024×1024) | Free Source (CC0) |
|---|---|---|---|
| **`concrete/`** | Monumental Vault Walls, Ceiling, Ribbed Pillars | `albedo.jpg`, `normal.jpg`, `roughness.jpg` | [AmbientCG](https://ambientcg.com) (e.g. Concrete 034 / 042) |
| **`basalt_floor/`** | Main Hall & Bay Flooring Slabs | `albedo.jpg`, `normal.jpg`, `roughness.jpg` | [AmbientCG](https://ambientcg.com) (e.g. Tiles 088 / Ground) |
| **`dark_metal/`** | Steel Support Beams, Blast Door Rams, Cable Trays | `albedo.jpg`, `normal.jpg`, `roughness.jpg`, `metalness.jpg` | [AmbientCG](https://ambientcg.com) (e.g. Metal 045 / 050) |
| **`hazard_stripes/`** | Doorway Archways, Threshold Warning Borders | `hazard_albedo.png`, `hazard_normal.png` | [AmbientCG](https://ambientcg.com) / Custom SVG |

---

## 5. Required 3D Interactive Props (GLB)

Place in: `d:\Arcade Artificial Hackathon\public\assets\models\props\`

| Model File | Placement | Visual Description | Free Source (CC0) |
|---|---|---|---|
| **`prop_power_cell.glb`** | East Bay & West Archive | Compact glass containment cylinder with spinning interior plasma core and metal endcaps. | Custom / Kenney Space Kit |
| **`prop_entry_relay.glb`** | Central Altar $(0, 0.45, -0.8)$ | Dual-socket angled console with Cell A/B receptacle rings and pull breaker lever. | Custom / Kenney Sci-Fi Kit |
| **`prop_generator.glb`** | East Maintenance Bay $(9.8, 0, -3.5)$ | Heavy industrial turbine generator with vibrating gauge dials and exhaust pipe. | Kenney Industrial Kit |
| **`prop_server_rack.glb`** | West Archive Wing | Monolithic containment server mainframe rack with glowing indicator strips. | Kenney Sci-Fi Kit |
| **`prop_cctv_camera.glb`** | 4 Surveillance Positions | Heavy industrial security camera with infrared LED ring and mounting arm. | Kenney Sci-Fi Kit |

---

## 6. Where to Download Them Immediately (100% Free / CC0)

1. **Characters + Skeletal Animations**:
   - **[Mixamo](https://www.mixamo.com)** (Free with free Adobe account):
     - Choose a sci-fi character (e.g., *Space Worker*, *Hazmat Suit*, *Prisoner*, *Vanguard*).
     - Search & download animations: **Idle**, **Running**, **Walking**, **Jump**.
     - Download as **FBX with Skin**, then export/convert to **`.glb`** using Blender or online glTF converter, OR:
   - **[Quaternius Sci-Fi Character Pack](https://quaternius.com/packs/modularscificontrol.html)**:
     - 100% CC0 public domain, pre-rigged and pre-animated in `.gltf`/`.glb`.
2. **PBR Textures**:
   - **[AmbientCG](https://ambientcg.com)**:
     - Filter by **1K-JPG** for instant low-memory downloads.
3. **Props**:
   - **[Kenney.nl](https://kenney.nl/assets/space-kit)**:
     - Download *Space Kit* and *Sci-Fi Kit* (CC0, already exported as `.glb`).

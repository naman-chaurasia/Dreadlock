# DREADLOCK Asset & Attribution Ledger

This document tracks all assets, reference sources, licensing information, and procedural generation methods used in DREADLOCK.

---

## 1. Procedural PBR Textures (Phase 2 Minimal Graphics Proof)

All textures used in the Phase 2 prototype are generated procedurally at runtime into HTML5 Canvases via `src/rendering/Materials.ts`. This ensures:
- **Zero external asset downloads** and zero storage impact on `C:` or `D:` drives.
- **Predictable memory allocation** (textures capped at 256×256 and 512×512).
- **100% reproducible PBR maps** (Diffuse, Tangent-Space Normal, Roughness) without external network dependencies.

| Material / Map | Resolution | Generation Method | License / Rights |
| :--- | :--- | :--- | :--- |
| **Concrete Vault Slabs** | 512 × 512 | Multi-octave Perlin-style noise, stone aggregate stippling, panel seams, height-to-normal tangent filter | Custom Procedural / CC0 equivalent |
| **Concrete Roughness** | 512 × 512 | Grayscale luminance variation (roughness 0.85 baseline) | Custom Procedural / CC0 equivalent |
| **Industrial Dark Metal** | 512 × 512 | Directional linear micro-scratch brushes, iron base, bevel highlights | Custom Procedural / CC0 equivalent |
| **Metal Roughness** | 512 × 512 | Specular polish channel (roughness 0.35 baseline) | Custom Procedural / CC0 equivalent |
| **Hazard Stripes** | 256 × 256 | 45-degree alternating amber/charcoal chevron stripes with grime layer | Custom Procedural / CC0 equivalent |
| **Architectural Glyphs** | 256 × 256 | Concentric runic geometric rings & inscribed angles with cyan glow | Custom Procedural / CC0 equivalent |

---

## 2. 3D Geometries & Architecture

| Asset | Type | Description | License / Rights |
| :--- | :--- | :--- | :--- |
| **Entry Vault Corridor** | Procedural Mesh | Ribbed concrete pillars, overhead steel beams, foundation slabs, cable trays | Custom Three.js Procedural / CC0 equivalent |
| **Covenant Energy Shard**| Procedural Mesh | Dual-layer Icosahedron + Octahedron with gyroscopic containment rings | Custom Three.js Procedural / CC0 equivalent |
| **Sealed Blast Gate** | Procedural Mesh | Interlocking dual blast slabs, hydraulic rams, warning beacon housing | Custom Three.js Procedural / CC0 equivalent |

---

## 3. Realistic 3D Assets & PBR Textures (Integrated 2026-10-23)

Source package provided in `D:\DREADLOCK_Starter_3D_Assets_v0.1.0\`. Deployed into `public/assets/`:

| Deployed Asset | Original Source | License | Use in Game |
|---|---|---|---|
| **`models/characters/guest_runner.gltf`** | Quaternius Cyberpunk Game Kit | CC0 Public Domain | The Captive Runner (Guest) with 22 skeletal animations (`Idle_Neutral`, `Run`, `Walk`, `Roll`, `Interact`) |
| **`models/characters/warden_overseer.glb`** | Kenney Space Kit (`astronautA.glb`) | CC0 Public Domain | Warden Overseer avatar silhouette |
| **`models/props/prop_generator.glb`** | Kenney Space Kit (`machine_generator.glb`) | CC0 Public Domain | Heavy generator prop in East Maintenance Bay |
| **`models/props/prop_barrels.glb`** | Kenney Space Kit (`barrels.glb`) | CC0 Public Domain | Industrial containment barrels in East Bay |
| **`models/props/prop_entry_relay.glb`** | Kenney Space Kit (`desk_computer.glb`) | CC0 Public Domain | Control console on central altar |
| **`textures/concrete/` (1K)** | AmbientCG (`Concrete042A`) | CC0 Public Domain | Realistic weathered brutalist walls and pillars (Albedo, NormalGL, Roughness) |
| **`textures/basalt_floor/` (1K)** | AmbientCG (`Tiles088`) | CC0 Public Domain | Realistic basalt foundation floor slabs (Albedo, NormalGL, Roughness) |
| **`textures/dark_metal/` (1K)** | AmbientCG (`Metal045A`) | CC0 Public Domain | Realistic dark steel girders, blast slabs, and seams (Albedo, NormalGL, Roughness, Metalness) |

---

## 4. Approved External Repositories & Reference Sources

Used strictly as optional research references per the Master Directive:
- **Three.js Manual & Docs**: https://threejs.org/docs/
- **Poly Haven**: https://polyhaven.com/ (CC0 reference standards for PBR channels)
- **ambientCG**: https://ambientcg.com/ (CC0 reference standards)
- **Kenney**: https://kenney.nl/ (CC0 reference standards)

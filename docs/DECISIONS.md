# DREADLOCK decision log

Append decisions with date, owner, scope, rationale, consequences, and affected documents. Do not silently rewrite earlier entries. A proposal is not an approval.

## Approved decision — 2026-10-23

- **Decision:** Build DREADLOCK directly for the browser using Three.js; do not use Unreal Engine or Unity as the active game runtime.
- **Owner/approval evidence:** User-authored request in the shared ChatGPT conversation [Game technology recommendation](https://chatgpt.com/share/6adb3aea-ad08-83e8-b8fb-cf01589b3b45): “if buling game using without unity and unreal engine instant plan to using thrre.js ingreated becuse plan these game direct on plan broswer here”. The surrounding conversation explicitly describes the revised Three.js browser stack and directs the agents to build in the existing Three.js project.
- **Status:** APPROVED by project owner; supersedes the GDD's Unreal engine assumption. No Unity implementation is authorized either.
- **Scope:** Browser runtime is product target. Preserve `Game Code/` as legacy/reference only; do not extend it as active runtime. Keep the GDD's design/gameplay requirements (roles, objectives, arenas, match rules) unless separately changed.
- **Intended stack direction from the conversation:** Three.js + TypeScript; Vite; Rapier 3D physics; Node.js + Socket.IO multiplayer; Blender-authored GLB/GLTF assets; Three.js shaders/post-processing; Web Audio API and properly licensed sound. This is a target stack recommendation, not evidence all components are installed or implemented. Inspect current root app before integrating components.
- **Consequences:** Update root instructions and project docs to make the browser target explicit. Rework Unreal-specific architecture requirements as browser responsibility boundaries. Plan server-authoritative multiplayer early; do not scale art/maps ahead of a connectivity proof. Document browser build/package/deployment needs. Retain the Unreal GDD implementation section as historical/source context but mark it superseded.

## Approved decision — 2026-10-24: PlayCanvas Scope & Boundary (Reference & Assets Only)

- **Decision:** PlayCanvas is strictly restricted to reference and compatible asset sourcing only. Do not migrate the game engine or incorporate the PlayCanvas engine runtime. The browser game runtime remains Three.js.
- **Owner/approval evidence:** User instruction in conversation: "PLANCANVA NO USE HERE ? / YES UPDATE TEHSE OF Allowed use for PlayCanvas:".
- **Status:** APPROVED.
- **Scope:**
  - **Allowed:** Technical research, WebGL shader inspiration, camera/lighting setups, and sourcing compatible CC0/open 3D models or textures.
  - **Prohibited:** Engine migration, importing the PlayCanvas npm engine/scripts, or replacing Three.js.
- **Affected documents:** `docs/ASSET_SOURCES.md`, `docs/PROJECT_SOURCE_OF_TRUTH.md`, `docs/DECISIONS.md`.

## Open decisions

| ID | Decision needed | Owner | Status |
|---|---|---|---|
| D-001 | Browser Three.js product runtime (no Unreal/Unity) | Project owner | APPROVED 2026-10-23; see decision above |
| D-002 | Which root web app is canonical: root project or `dreadlock-web/` nested scaffold? | Project owner | Root app selected by current project structure; confirm before any nested app work |
| D-003 | Which one of the three arenas repeats in round four, or is this selected dynamically? | Design owner | OPEN |
| D-004 | Which online/session provider and network scope (LAN/public internet) are required? | Technical owner | OPEN; inspect existing project first |
| D-005 | Are proposed Warden costs, regeneration, score points, exact bindings, and two-shard Entry Vault objective approved? | Design owner | OPEN / provisional per GDD |

## Decision template

### YYYY-MM-DD — Short decision title
- Owner/approval evidence:
- Status: PROPOSED / APPROVED / REJECTED / SUPERSEDED
- Decision and scope:
- Rationale:
- Consequences / migration:
- Documents, code, tests affected:



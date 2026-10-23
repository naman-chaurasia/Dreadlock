# Project map and ownership

This is a map of observed top-level areas, not a promise that every directory is active. Browser Three.js is the approved target; `Game Code/` is legacy. Keep one source of truth per runtime and avoid duplicate “current” implementations.

| Path | Observed role | Ownership rule |
|---|---|---|
| `AGENTS.md` | Root instructions for Codex and other agents | Update when durable routing/ownership policy changes. |
| `Documents/DREADLOCK_Game_Concept_and_Working_Document.docx` | Supplied canonical GDD | Read-only unless explicitly asked to revise. |
| `DREADLOCK_Game_Concept_and_Working_Document.docx` | Root GDD mirror | Compare with Documents copy if changes diverge; do not edit independently. |
| `extracted_concept.txt` | Searchable GDD derivative | Regenerate only through an agreed workflow; not canonical. |
| `docs/PROJECT_SOURCE_OF_TRUTH.md` | Integrated vision/requirements/architecture/acceptance baseline | Update on approved decisions or verified changes. |
| `docs/WORLD_AND_LEVELS.md` | Canonical detailed browser arena plan for Entry Vault, Living Foundry, and Observatory | Level-design source. Update only with approved design changes or verified layout implementation. |
| `docs/PROJECT_MAP.md` | This directory/ownership map | Update when repository structure changes. |
| `docs/IMPLEMENTATION_GAPS.md` | Evidence-backed priority backlog | Keep status and evidence current; no invented completion. |
| `docs/DECISIONS.md` | Decision log | Append dated approved choices; mark unresolved questions explicitly. |
| `docs/ASSET_CREDITS.md` | Asset/license provenance | Asset owner records exact source/license before shipping. |
| `docs/PHASE_*_PROOF_REPORT.md` | Historical verification evidence | Append/update only after rerunning checks; include date and environment. |
| `docs/entry-vault-prototype.png` | Visual evidence image | Preserve source; annotate provenance in report if known. |
| `src/` | Root Three.js browser prototype source | Browser code only; current browser proof track. Keep playable and label its scope. |
| `src/core`, `character`, `controls`, `gameplay`, `physics`, `rendering`, `world`, `audio` | Browser subsystems | Owners modify their subsystem and document integration contracts. |
| Root `index.html`, `package.json`, lock, `tsconfig.json`, `vite.config.ts` | Root browser app shell/toolchain | Root app dependencies and commands only. |
| `Game Code/` | Preserved Unreal project (`DreadLock.uproject`, `Content/`), legacy only | Do not extend as the active runtime; preserve existing project files and history. |
| `Game Code/Content/` | Legacy Unreal `.uasset`, `.umap`, generated external actor/object folders | Preserve as historical material; do not use as active browser levels or rename/move generated folders manually. |
| `dreadlock-web/` | Separate nested Vite app/scaffold with own source, lock and `dist` | Not selected as active app; do not merge or update it without an explicit need. Root app is active target. |
| `dist/`, `dreadlock-web/dist/` | Build output | Generated; no hand edits. |
| `node_modules/`, `dreadlock-web/node_modules/` | Installed dependencies | Generated; package manager owns. |
| `.agents/` | Agent skills and workflows (including Unreal and art workflows) | Inspect skill instructions when invoked; do not confuse workflow prompts with product requirements. |
| `.freebuff/`, `.vscode/`, `.mcp.json`, `skills-lock.json` | Tool/editor/agent configuration | Preserve; modify only for explicit tooling needs. |
| `public/`, `src/assets/`, `Tests/`, `Reports/`, root `Assets/`, root `Levels/` | Not observed as established owner roots | Do not introduce duplicate folders casually. Browser assets may use `public/` or `src/assets/` after confirming conventions. Legacy Unreal assets/maps remain under `Game Code/Content/` and are not active game content. Put docs/reports under `docs/`. |

## Handoff checklist

Every task handoff names the runtime, requirement, intended paths, acceptance evidence, and open dependencies. Before changing a file, inspect existing status and ownership. After changing structure, update this map. No agent should be assigned only a phase prompt without this map and `PROJECT_SOURCE_OF_TRUTH.md`.



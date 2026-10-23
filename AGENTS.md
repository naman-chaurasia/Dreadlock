# DREADLOCK agent instructions

Read `docs/PROJECT_SOURCE_OF_TRUTH.md` before changing game code, assets, levels, or project structure. The canonical design source is `Documents/DREADLOCK_Game_Concept_and_Working_Document.docx` (root copy is a mirror); `extracted_concept.txt` is a searchable derivative. Reports record claims and historical verification, not current truth: inspect the current source before relying on them.

## Product and engine boundary
- The game target is the browser-based Three.js project, without Unreal Engine or Unity. The user approved this direction in the shared ChatGPT conversation `https://chatgpt.com/share/6adb3aea-ad08-83e8-b8fb-cf01589b3b45` (see `docs/DECISIONS.md`). The uploaded GDD remains the design source for two-player asymmetric horror, four 120-second rounds, alternating Guest/Warden roles, three arenas, and online play; its Unreal implementation brief is legacy guidance only where engine-specific.
- The root TypeScript/Vite/Three.js app (`src/`, root `index.html`, root `package.json`) is the selected game project and currently implements a single-player Entry Vault proof. It is not yet the full game and does not implement multiplayer or Warden gameplay.
- `Game Code/` is the preserved Unreal project/legacy implementation baseline. The repo history begins with it. Do not extend it as the active game. The browser pivot is approved and recorded in `docs/DECISIONS.md`; do not reopen it unless the user changes direction.
- `dreadlock-web/` is a separate nested Vite scaffold/build with its own dependencies and `dist`; do not assume it is the canonical root prototype. Confirm intended ownership before changing it.

## Source and change rules
- Preserve existing user changes, project files, and Git history. Never commit, push, reset, clean, or delete project data unless explicitly requested.
- Make the smallest coherent change for the requested task. Do not generate the full game when asked for context or documentation.
- Treat `dist/`, `node_modules/`, Unreal `Binaries/`, `Intermediate/`, `Saved/`, `DerivedDataCache/`, generated/external actor content, and build outputs as generated or tool-owned. Do not hand-edit them.
- Treat `Documents/` GDD and the root GDD mirror as source material. Edit design intent only with explicit design approval; record approved changes and rationale in `docs/DECISIONS.md`.
- Before editing, inspect status and the exact target files. If repository state/status is unavailable, report that limitation and avoid destructive Git operations.
- Do not claim tests or runtime checks passed unless you ran them in this checkout. Do not run tests/builds unless requested; documentation-only verification can check paths, links, and the resulting diff.

## Durable documentation map
- `docs/PROJECT_SOURCE_OF_TRUTH.md`: design, current/target boundary, mechanics, arena plans, architecture, controls, art, assets, networking, acceptance criteria, roadmap.
- `docs/WORLD_AND_LEVELS.md`: canonical arena layouts, objective chains, routes, Warden camera tradeoffs, mechanism counterplay, asset placement, and level acceptance conditions.
- `docs/PROJECT_MAP.md`: directory map and ownership.
- `docs/IMPLEMENTATION_GAPS.md`: evidence-backed prioritized backlog and mismatches.
- `docs/DECISIONS.md`: approved decisions and unresolved decisions; append, never silently rewrite history.
- `docs/ASSET_CREDITS.md`: attribution/provenance ledger; every non-original asset needs source, license, author, and use record.
- `docs/PHASE_*_PROOF_REPORT.md`: dated evidence snapshots; update only when reverified.

## Ownership boundaries
- Root `src/`: active browser game code; keep it buildable as the selected product runtime.
- `Game Code/`: Unreal project and Unreal-native content; do not add browser runtime code here.
- `docs/`: specifications, decision records, gap/backlog, attribution, and evidence reports.
- `Documents/`: canonical supplied design documents; read-only unless the user explicitly asks to revise them.
- Root `index.html`, `package*.json`, `tsconfig.json`, `vite.config.ts`: root browser app configuration.
- `dreadlock-web/`: separate nested web scaffold; ask/record ownership before treating as canonical.
- `dist/`, `node_modules/`, Unreal generated folders: generated/tool-managed; never source-of-truth.
- `.agents/`, `.freebuff/`, `.vscode/`: tool/workflow/editor configuration; inspect relevant instructions before changing; keep agent-specific workflow separate from product truth.
- Future `Assets/`, `Levels/`, `Tests/`, `Reports/` directories do not currently exist. Do not create duplicate roots casually. Preserve legacy Unreal assets/maps inside `Game Code/Content/`; for browser source assets, use `src/assets/` and `public/` only after confirming the root app's bundling conventions. Put automated checks alongside the owning project (e.g. root `tests/` only after agreed). Keep reports and decisions under `docs/`.

## Required agent handoff
Before implementation, state: which runtime/project is being changed, which GDD requirement it serves, expected files, acceptance evidence, and any unresolved dependency. Afterward update the relevant docs/backlog and report files changed and checks actually run.




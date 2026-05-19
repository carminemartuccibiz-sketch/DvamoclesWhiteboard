# DVAMOCLES SWORD™ — Spatial Cognitive Runtime Migration Plan

**Status:** Planning only — **no application code changes until human approval of this document.**  
**Target architecture:** PixiJS (WebGL) canvas runtime · Yjs (CRDT + `UndoManager`) · strict plugin/add-on registries · FastAPI modular backend.  
**Source of truth:** `docs/dvamocles_sword_master_architecture_guidelines_cursor.md`, `docs/Capitolo 3_ Architettura di Estendibilità per l'Ec (1).md`, `docs/ChatGPT-Analisi stato attuale MVP.md`  
*(Note: guidelines live under `docs/`; rename or symlink to `_docs/` if desired for tooling.)*

---

## 0. Executive Summary

The current MVP is a **well-decoupled React chrome layer** wrapped around **tldraw v5** (`hideUi` + `useEditor`). That separation is the primary salvage asset. The migration is not a UI rewrite; it is an **engine replacement** plus **data-model and persistence realignment** toward a **data-oriented, viewport-driven, plugin-first Spatial Cognitive Runtime**.

**Non-negotiable architectural law (from Master Guidelines):**

```txt
React UI  ≠  Canvas Runtime  ≠  World Data Model  ≠  AI Runtime
```

**End-state stack (target):**

| Layer | Technology |
|-------|------------|
| UI | React 19 + Vite + Radix + Tailwind (existing floating cards) |
| Canvas runtime | PixiJS 8 + `pixi-viewport` + imperative render loop |
| World state | Yjs document (`Y.Map` entities) + action/delta history |
| Spatial systems | Spatial hash (hot updates) + Quadtree (viewport culling) |
| Sketch strokes | `roughjs` / Perfect Freehand pipeline on GPU paths |
| Backend | FastAPI + pathlib JSON today → snapshots + incremental deltas |
| Extensibility | `frontend/src/plugins/*` manifests + `backend/modules/*` routers |

---

## 1. Current State Inventory (Baseline)

### 1.1 What exists today

| Area | Location | Role |
|------|----------|------|
| App shell | `frontend/src/App.tsx` | `<Tldraw hideUi>` + flex overlay (TopBar, sidebars, toolbar, minimap) |
| Toolbar | `frontend/src/hooks/useToolbarTools.ts`, `BottomToolbar.tsx` | Tools bound to `editor.setCurrentTool` |
| Properties | `frontend/src/hooks/usePropertiesPanel.ts`, `RightSidebar.tsx` | tldraw `Default*Style` props |
| tldraw adapters | `frontend/src/lib/tldraw/*` | `applyStyle`, sketchy dash/font, export, import, lined paper |
| Minimap | `frontend/src/components/ui/CanvasMinimap.tsx` | 2D canvas radar via `getShapeMaskedPageBounds` |
| Persistence | `backend/main.py` | `POST /api/projects/save`, `GET /api/projects/{id}` — **tldraw snapshot JSON** |
| Launcher | `run.py` | Vite + Uvicorn |
| Design tokens | `frontend/src/components/ui/chrome.tsx`, `panel.tsx`, `styles/*` | Glassmorphism chrome |

### 1.2 Critical coupling points (migration risk)

1. **`useEditor()` must exist inside `<Tldraw>`** — all chrome hooks depend on tldraw context.
2. **Save payload** — `document: getSnapshot(editor.store)` is tldraw-native; backend `SaveProjectPayload.document` is typed as opaque `dict` but semantically tldraw.
3. **Tool/shape semantics** — geo tools, `line`, `draw`, `arrow`, groups with `meta.schemaName` are tldraw shape types.
4. **Style system** — `TLDefaultColorStyle` enum (12 colors); properties panel is correct for tldraw, not yet engine-agnostic.
5. **`roughjs` is installed but sketchy is implemented via tldraw `DefaultDashStyle: 'draw'`**, not custom RoughJS rendering.

---

## 2. Salvage & Purge Strategy

### 2.1 KEEP (salvage — refactor imports/paths only)

#### React floating UI (high reuse ~90–95%)

| Path | Notes |
|------|--------|
| `frontend/src/App.tsx` | **Layout shell only** — remove `<Tldraw>`; mount `CanvasHost` + existing flex chrome |
| `frontend/src/components/TopBar.tsx` | Save/export/settings; rewire save to world-state serializer |
| `frontend/src/components/LeftSidebar.tsx` | Outline + import UX; rewire to `WorldStore` / group entities |
| `frontend/src/components/RightSidebar.tsx` | Property cards layout |
| `frontend/src/components/BottomToolbar.tsx` | Button chrome; tools driven by `ToolRegistry` |
| `frontend/src/components/SettingsModal.tsx` | App settings (non-canvas) |
| `frontend/src/components/ExportMenu.tsx` | Export triggers; reimplement via Pixi export pipeline |
| `frontend/src/components/ui/CanvasMinimap.tsx` | **Concept salvage** — rebind to `CameraController` + spatial index bounds |
| `frontend/src/components/ui/chrome.tsx` | Design tokens |
| `frontend/src/components/ui/panel.tsx` | `FloatingCard`, `PropertyCard` |
| `frontend/src/components/ui/utils.ts` | `cn()` |
| `frontend/src/components/properties/sections/*` | UI controls; replace tldraw types with engine style contracts |
| `frontend/src/components/properties/sectionStyles.ts` | Toggle/label classes |
| `frontend/src/components/properties/tldrawColors.ts` | **Rename** → `enginePalette.ts`; keep 12 enum swatches |
| `frontend/src/styles/*` | Global CSS, Tailwind, fonts |
| `frontend/index.html` | Entry |
| `frontend/vite.config.ts` | HMR + build |
| `frontend/src/main.tsx` | Bootstrap |

#### Property section files to keep as UI (logic rewired)

- `ColorPickerSection.tsx`, `FillStyleSection.tsx`, `StrokeStyleSection.tsx`, `StrokeWidthSection.tsx`, `SloppinessSection.tsx`, `OpacitySection.tsx`, `AlignmentSection.tsx`, `ObjectIdSection.tsx`

#### Backend & ops (high reuse ~85–100%)

| Path | Notes |
|------|--------|
| `backend/main.py` | Core routes, CORS, pathlib safety — **evolve payload schema** |
| `backend/data/projects/*` | Existing files = migration input (tldraw → DVAMOCLES format) |
| `run.py` | Unchanged |
| `README.md` | Update after phases |

#### Libraries to keep or add (not in MVP yet)

| Package | Role |
|---------|------|
| `roughjs` | Sketchy stroke rendering in Pixi layer |
| **Add:** `pixi.js`, `pixi-viewport`, `yjs`, `zustand` (or keep minimal custom store), `rbush` (spatial index) | Per architecture docs |
| **Optional later:** `perfect-freehand`, `gl-matrix` | Stroke + camera math |

---

### 2.2 PURGE (remove after replacement exists)

#### npm dependencies

| Package | Reason |
|---------|--------|
| `tldraw` | License + architectural lock-in; full removal in Phase 1 |

#### Delete files (engine-specific)

| Path | Reason |
|------|--------|
| `frontend/src/lib/tldraw/applyStyle.ts` | tldraw `StyleProp` API |
| `frontend/src/lib/tldraw/applySketchyStyle.ts` | tldraw dash/font only |
| `frontend/src/lib/tldraw/createLinedPaper.ts` | tldraw `createShapes` / `groupShapes` |
| `frontend/src/lib/tldraw/importFiles.ts` | tldraw `putExternalContent` |
| `frontend/src/lib/tldraw/exportDocument.ts` | `editor.toImage` / `getSvgString` |
| `frontend/src/lib/tldraw/createBranch.ts` | Already removed from product; delete if still present |

#### Delete or hollow out (after UI rewired)

| Path | Reason |
|------|--------|
| `frontend/src/hooks/useToolbarTools.ts` | Replace with `engine/tools/useToolController.ts` + registry |
| `frontend/src/hooks/usePropertiesPanel.ts` | Replace with `engine/hooks/useSelectionStyles.ts` subscribing to world store |
| `frontend/src/components/ColorPickerPopover.tsx` | Superseded by palette-only popover in Phase 3/4 |
| `frontend/src/components/DvamoclesOverlay.tsx` | Redundant if layout lives in `App.tsx` |
| `frontend/src/components/TopLeftMenu.tsx` | Deprecated re-export |
| `frontend/src/components/TopRightStatus.tsx` | Stub; merged into TopBar |
| `frontend/src/components/ProjectNavigation.tsx` | Re-export stub |
| `frontend/src/components/ImportAssets.tsx` | Stub |
| `frontend/src/components/FloatingToolbar.tsx` | Re-export stub |
| `frontend/src/components/PropertiesPanel.tsx` | Barrel only |
| `frontend/src/components/properties/PropertiesPanel.tsx` | Barrel only |

#### Remove from App / build

- `import 'tldraw/tldraw.css'`
- Any `@tldraw/*` transitive imports
- CSS rule `.tl-watermark_logo` (no longer needed)

#### Optional cleanup (non-blocking, Phase 1b)

Unused shadcn scaffolding under `frontend/src/components/ui/` (`calendar`, `chart`, `command`, etc.) — **47+ files** with missing peer deps; safe to delete or move to `ui/_archive/` to fix `tsc -b`.

---

### 2.3 MIGRATE (transform, do not delete blindly)

| Asset | Migration action |
|-------|------------------|
| `CanvasMinimap.tsx` | Read bounds from `SpatialIndex` + `CameraState`, not `editor.getViewportPageBounds()` |
| `TopBar` save | Serialize `Y.Doc` + metadata; POST same endpoint with versioned schema |
| `LeftSidebar` outline | Map `group` entities by `meta.schemaName` equivalent in world model |
| `AlignmentSection` | Call engine `alignEntities` / `distributeEntities` (port of tldraw math) |
| `backend/data/projects/*.json` | One-time **tldraw → DVAMOCLES** migration script (Phase 6) |
| `roughjs` | Wire into `SketchStrokeRenderer` (Phase 5 tools) |

---

## 3. Target Frontend Architecture (Post-Migration)

```txt
frontend/src/
├── app/                    # App.tsx, providers
├── ui/                     # chrome, panels (from components/ui + components/*Bar*)
├── engine/
│   ├── pixi/               # Application, viewport, layers
│   ├── camera/             # pan/zoom, world ↔ screen
│   ├── world/              # entity store, Yjs binding
│   ├── spatial/            # hash grid + quadtree + RBush queries
│   ├── render/             # LOD, batching, layer compositor
│   ├── input/              # pointer, keyboard, tool routing
│   ├── history/            # Y.UndoManager + action log adapter
│   └── tools/              # select, pan, line, draw, geo, eraser, …
├── registry/
│   ├── pluginRegistry.ts   # import.meta.glob manifests
│   ├── toolRegistry.ts
│   ├── shapeRegistry.ts
│   └── panelRegistry.ts
├── plugins/                # drop-in extensions (empty until Phase 4)
├── contracts/              # TypeScript types shared by UI + engine
└── bridge/                 # React ↔ engine event bus (no React in render loop)
```

```txt
backend/
├── main.py                 # thin app factory
├── core/                   # persistence, project IO
├── modules/                # addon routers (embeddings, etc.)
└── migrations/             # tldraw import, schema versions
```

---

## 4. Execution Phases

Each phase is **atomic**: merge only when its testing checkpoint passes. Do not start Phase N+1 until N is green.

---

### Phase 0 — Migration Branch & Contracts (1–2 days)

**Goal:** Freeze contracts so UI and engine teams (or sequential prompts) do not diverge.

**Deliverables:**

- `contracts/entity.ts` — `EntityId`, `EntityType`, bounds, style bag, `meta`
- `contracts/world-document.ts` — schema version, snapshot + delta envelope
- `contracts/engine-events.ts` — `selectionChanged`, `cameraChanged`, `documentChanged`, `toolChanged`
- `MIGRATION_BRANCH` + feature flag `VITE_ENGINE=legacy|pixi` (optional short-lived)

**Testing checkpoint:**

- [ ] Contracts compile with `tsc --noEmit`
- [ ] No runtime change; tldraw MVP still runs on `main` / flag `legacy`

---

### Phase 1 — Dependency Purge & Engine Swap (PixiJS + WebGL Init)

**Goal:** Replace `<Tldraw>` with a Pixi canvas that fills the viewport; chrome remains visible but **disconnected** from canvas (read-only mock selection OK).

**Work:**

1. Add dependencies: `pixi.js`, `pixi-viewport` (and types if needed).
2. Create `engine/pixi/CanvasHost.tsx` — mounts full-screen WebGL canvas inside current `App.tsx` flex shell (center spacer).
3. Implement `CameraController` via `pixi-viewport` (pan, wheel zoom, clamp sensible zoom limits).
4. Render layers: `backgroundGrid`, `worldContainer`, `overlayContainer` (empty).
5. Remove `tldraw` from `package.json`; delete `lib/tldraw/*` and tldraw CSS import.
6. Stub `engine/bridge/EngineProvider.tsx` — React context exposing camera + event emitter (no Yjs yet).

**Testing checkpoint:**

- [ ] App boots with no tldraw in bundle (`npm run build` succeeds)
- [ ] 60 FPS empty pan/zoom on grid
- [ ] Floating UI still lays out (TopBar, sidebars, toolbar) without overlap clipping
- [ ] No `useEditor` imports remain in `src/`
- [ ] HMR stable on Windows (`vite.config.ts` clientPort 5173)

---

### Phase 2 — State Management (Yjs + Undo/Redo Stack)

**Goal:** Authoritative world model outside React; delta-based history; no full JSON snapshots per stroke.

**Work:**

1. Add `yjs`; define `Y.Map` structure: `entities`, `relations`, `documentMeta`.
2. `engine/world/WorldDocument.ts` — bind Yjs ↔ plain TS views for UI.
3. `engine/history/HistoryController.ts` — `Y.UndoManager` scoped to shape edits; optional action envelope `{ type, before, after }` for persistence (per Master Guidelines §9).
4. In-memory entity CRUD API: `createEntity`, `updateEntity`, `deleteEntity`, `moveEntity`.
5. Render **placeholder rectangles** for entities from Yjs (Pixi `Graphics` pool).
6. Persist locally: `Y.encodeStateAsUpdate` for dev autosave hook (optional).

**Testing checkpoint:**

- [ ] Create/move/delete 1k rectangle entities programmatically — no React re-render per entity
- [ ] Undo/redo restores position after 50 random moves
- [ ] Memory stable (no full snapshot array growth per action)
- [ ] `store.listen` equivalent: UI receives `documentChanged` via bridge only

---

### Phase 3 — UI Re-wiring (React Floating UI ↔ Pixi Event System)

**Goal:** Restore MVP UX: toolbar tools, properties panel, selection, alignment, export hooks — all via **engine contracts**, not tldraw.

**Work:**

1. `bridge/useEngine()` hook — selection, active tool, shared styles, camera.
2. Rewrite `useToolController` — `setCurrentTool('line'|'draw'|…)` drives input FSM in `engine/input`.
3. Rewire `usePropertiesPanel` → read/write `StyleBag` on selection + `setDefaultStyle` for next entity.
4. Implement sketchy as **render flag** (`sketchy: true` → RoughJS path), decoupled from fill.
5. Rewire `ColorPickerSection` — only `TLDefaultColorStyle` union (12 values); remove hex paths.
6. `AlignmentSection` → `world.alignEntities(ids, 'left'|'center-horizontal'|…)` port.
7. `TopBar` save → POST `{ schemaVersion, snapshot, deltas?, project_name }` (backend accepts both during transition).
8. `CanvasMinimap` → subscribe to `cameraChanged` + spatial index bounds.

**Testing checkpoint:**

- [ ] All toolbar tools activate correct cursor/input mode
- [ ] Line tool + draw tool both work; line adjacent to pencil in toolbar
- [ ] Properties apply to selection and next-created shapes
- [ ] Sketchy toggle affects dash/font only, not fill
- [ ] Save/load round-trip via FastAPI (new schema)
- [ ] Minimap panning tracks main viewport

---

### Phase 4 — Plugin Registry Implementation

**Goal:** Plugin-first platform per Chapter 3 — zero core imports of feature plugins.

**Work:**

1. `registry/pluginRegistry.ts` — `import.meta.glob('../plugins/*/manifest.ts', { eager: true })`.
2. Registries: `registerTool`, `registerShapeRenderer`, `registerPanel`, `registerCommand`.
3. `plugins/_example/` — manifest + dummy tool button + inspector panel.
4. `BottomToolbar` — merge `coreTools` + `pluginTools` from registry.
5. `RightSidebar` — conditional plugin panels via `panel.condition(selection)`.
6. Backend: `backend/modules/` + `load_module_routers(app)` pattern from Chapter 3.
7. Example module: `backend/modules/health_ext/router.py` (proof of auto-mount).

**Testing checkpoint:**

- [ ] Adding `plugins/hello/manifest.ts` shows new toolbar button **without** editing `App.tsx`
- [ ] Disabling plugin folder removes tool after rebuild
- [ ] Backend `/api/modules/hello/...` mounts via folder convention
- [ ] Invalid manifest fails fast at startup with clear error

---

### Phase 5 — Spatial Document Mapping & Advanced Tools

**Goal:** Performance architecture + differentiated features (not Excalidraw clone).

**Work:**

1. **Spatial hash grid** — O(1) insert/move/remove for drag + hit-test hot path.
2. **Quadtree** — viewport query + marquee selection.
3. **Viewport culling** — only visible entities enter render list each frame.
4. **LOD resolver** — semantic zoom thresholds (e.g. hide text detail < 20% zoom).
5. **GPU batching** — static `Graphics` batches for grid, edges, geo fills.
6. **Line tool** — polyline entities with spatial endpoints.
7. **Draw tool** — freehand → simplified path → entity.
8. **Lined paper** — composite entity or group template (port from old `createLinedPaper` logic).
9. **Import assets** — file drop → image entities (textures in Pixi).
10. **Export** — PNG/SVG via Pixi render texture + vector export path.

**Testing checkpoint:**

- [ ] 5k entities: pan/zoom ≥ 55–60 FPS on mid-range GPU
- [ ] Viewport shows only culled subset (verify via debug overlay count)
- [ ] LOD switches at configured zoom thresholds
- [ ] Export PNG/SVG of selection and full bounds
- [ ] Spatial hash + quadtree results match brute-force selection on sample set

---

### Phase 6 — Persistence, Migration & Backend Alignment

**Goal:** Production-grade save format; migrate existing tldraw JSON projects.

**Work:**

1. Versioned `DvamoclesDocument` schema (`schemaVersion: 1`).
2. Backend: snapshots + append-only delta log per project (Master Guidelines §9).
3. `backend/migrations/tldraw_v5_import.py` — best-effort map tldraw shapes → entities.
4. Deprecate tldraw-specific field names in OpenAPI models.
5. README + license section: no tldraw dependency.

**Testing checkpoint:**

- [ ] Load old `untitled-project-1.json` through migrator without crash
- [ ] Save → reload → visual parity within agreed tolerance
- [ ] Corrupt file handling unchanged (400/500)
- [ ] `run.py` still starts full stack

---

## 5. Execution Prompts (Copy-Paste per Phase)

Use these **verbatim** (adjust paths if branch names differ) when ready to execute. Each assumes `@workspace` and the three `docs/*.md` architecture files.

---

### Phase 0 prompt

```txt
@workspace @docs

Act as Principal Architect. Phase 0 ONLY — no engine rewrite yet.

Create `frontend/src/contracts/` with TypeScript types for:
- Entity (id, type, transform, bounds, styleBag, meta)
- WorldDocument (schemaVersion, entities map, relations)
- Engine events (selectionChanged, cameraChanged, documentChanged, toolChanged)
- Persistence envelope (snapshot + optional delta[])

Add `frontend/src/contracts/index.ts` barrel. Ensure `npx tsc -p frontend --noEmit` passes for contracts only.
Do NOT remove tldraw. Do NOT change App.tsx behavior.

Output: new files only + brief CONTRACTS.md in contracts folder.
```

---

### Phase 1 prompt

```txt
@workspace @docs

Execute Phase 1: Dependency Purge & PixiJS Engine Swap.

1. Add pixi.js + pixi-viewport. Create `frontend/src/engine/pixi/CanvasHost.tsx` with layered containers (grid, world, overlay) and pixi-viewport camera (pan/zoom).
2. Replace `<Tldraw>` in App.tsx with `<CanvasHost />`; keep all floating UI (TopBar, LeftSidebar, RightSidebar, BottomToolbar, CanvasMinimap shell).
3. Remove `tldraw` from package.json; delete `frontend/src/lib/tldraw/`, tldraw CSS import, and ALL `useEditor` usage. Stub `EngineProvider` with camera events only.
4. Sidebars: ensure `max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar pb-6`.

Constraints: NO React rendering per entity. NO Yjs yet. Imperative Pixi loop only.

Verify: vite build, 60fps pan/zoom, no tldraw in bundle.
```

---

### Phase 2 prompt

```txt
@workspace @docs

Execute Phase 2: Yjs World State + Undo/Redo.

1. Add yjs. Implement `engine/world/WorldDocument.ts` using Y.Map for entities.
2. Implement `engine/history/HistoryController.ts` with Y.UndoManager; document action shape { type, before, after } for future persistence.
3. Render each entity as a Pixi Graphics placeholder from Yjs data (data-oriented, not React components).
4. Expose CRUD + undo/redo on `EngineProvider`.

Constraints: React must subscribe only to coarse events, not per-entity state. No full JSON snapshots on each pointer move.

Verify: 1k entities, undo/redo after 50 moves, DevTools memory stable.
```

---

### Phase 3 prompt

```txt
@workspace @docs

Execute Phase 3: Re-wire React Floating UI to Engine Event Bus.

Rewire without tldraw:
- useToolController: select, pan, geo, arrow, draw, line, text, eraser (NO note, NO branch). Line tool adjacent to draw.
- usePropertiesPanel: StyleBag + 12 TLDefaultColorStyle colors only (remove hex picker).
- Sketchy: render flag only (dash sketchy), fill independent.
- AlignmentSection: align/distribute via world store.
- TopBar save: http://127.0.0.1:8000 with new schemaVersion + encoded world snapshot.
- CanvasMinimap: camera + spatial bounds from engine.

Keep modular flex layout in App.tsx. Do not reintroduce tldraw.

Verify full MVP parity checklist from MIGRATION_PLAN.md Phase 3.
```

---

### Phase 4 prompt

```txt
@workspace @docs

Execute Phase 4: Plugin Registry (frontend + backend).

Frontend:
- `registry/pluginRegistry.ts` via import.meta.glob on `plugins/*/manifest.ts`
- Registries: tools, shapes, panels, commands
- Example plugin `plugins/example/` adding a toolbar button + property panel section
- BottomToolbar + RightSidebar consume registries (core MUST NOT import plugins directly)

Backend:
- `backend/modules/<name>/router.py` auto-loaded by `load_module_routers`
- Example module mounted at `/api/modules/example`

Verify: new plugin appears without editing App.tsx; backend route responds.
```

---

### Phase 5 prompt

```txt
@workspace @docs

Execute Phase 5: Spatial Indexing, Culling, LOD, Batching, Advanced Tools.

Implement:
1. Spatial hash grid (insert/remove/query O(1) average) for drag + hit-test.
2. Quadtree for viewport culling and marquee selection.
3. LOD resolver: semantic zoom (e.g. simplify/hide labels below 20% zoom).
4. GPU batching for grid + static edges.
5. Line tool (straight polyline entities), draw tool (freehand), lined-paper template, import images, export PNG/SVG from Pixi.

Constraints: viewport-driven render list each frame; never iterate all entities in render loop.

Verify: 5k entity benchmark ≥55 FPS; debug overlay shows culled count; export works.
```

---

### Phase 6 prompt

```txt
@workspace @docs

Execute Phase 6: Persistence, Delta States, tldraw Migration.

1. Define DvamoclesDocument schema v1 (snapshot + delta log).
2. Update backend/main.py models and save/load; keep pathlib security.
3. Add `backend/migrations/tldraw_to_dvamocles.py` for existing JSON in data/projects/.
4. Update README (remove tldraw; document MIT stack).

Verify: migrate sample project; save/reload round-trip; run.py works.
```

---

## 6. Testing Checkpoints Summary

| Phase | Gate (must pass) |
|-------|------------------|
| 0 | Contracts compile; MVP unchanged |
| 1 | No tldraw; Pixi pan/zoom 60 FPS; UI layout intact |
| 2 | 1k entities; undo/redo; no per-entity React |
| 3 | Tools/properties/save/minimap/align work on engine |
| 4 | Drop-in plugin without core edits |
| 5 | 5k entities performance; culling/LOD/batching; export |
| 6 | Schema migration; backend round-trip; docs updated |

---

## 7. Risk Register

| Risk | Mitigation |
|------|------------|
| tldraw shape semantics lost in migration | Phase 6 migrator + manual mapping table for geo/arrow/line/draw |
| Text editing complexity in Pixi | Phase 5+ — HTML overlay only for active editor, not per-shape React |
| Yjs learning curve | Start read-only binding; add collaboration later |
| Scope creep (AI/RAG early) | **Forbidden** until Phase 5 checkpoint green (per Master Guidelines §15) |
| Unused shadcn UI breaks `tsc -b` | Purge in Phase 1b or exclude from `tsconfig` until needed |

---

## 8. Human Review Checklist (Before Phase 1)

- [ ] Approve PixiJS + pixi-viewport + Yjs as locked stack
- [ ] Approve phased cutover (no big-bang single PR)
- [ ] Confirm tldraw project files may be lossy-migrated
- [ ] Confirm plugin folder convention (`frontend/src/plugins`, `backend/modules`)
- [ ] Assign priority: performance (Phase 5) vs. early save/migrate (Phase 6 reorder?) if needed

**After approval:** run **Phase 1 prompt** only. Do not skip phases.

---

*Document generated for DVAMOCLES SWORD™ architectural migration. Revise version tag when schema or phase boundaries change.*

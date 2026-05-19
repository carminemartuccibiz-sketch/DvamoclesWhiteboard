# DVAMOCLES SWORD™ — Spatial Cognitive Runtime Migration Plan

**Document version:** `2.0-audit` (Principal Architect cross-reference audit)  
**Last audited:** 2026-05-19  
**Sources:** `docs/dvamocles_sword_master_architecture_guidelines_cursor.md`, `docs/Capitolo 3_ Architettura di Estendibilità per l'Ec (1).md`, `docs/ChatGPT-Analisi stato attuale MVP.md`, `ui figma new/Modular UI for DVAMOCLES SWORD/`, live codebase `frontend/` + `backend/`

> **Audit finding:** The repository has **already executed Phases 1–7 in code** (Pixi engine, Yjs, plugins, culling/LOD, persistence/migrator). This plan is rewritten to reconcile **as-built reality**, **remaining gaps**, and **Phase 0 pre-flight fixes** that must pass before any new phase work or release.

---

## 0. Executive Summary

### 0.1 Architectural law (unchanged)

```txt
React UI  ≠  Canvas Runtime  ≠  World Data Model  ≠  AI Runtime
```

### 0.2 Target stack (locked versions — verify in `frontend/package.json`)

| Layer | Package | Pinned / resolved | Notes |
|-------|---------|-------------------|--------|
| UI | `react` / `react-dom` | **^19.2.6** | Figma export targets React **18.3.1** — do not downgrade; port Figma components, do not copy `package.json` wholesale |
| Build | `vite` | **^8.0.12** | Figma export uses Vite **6.3.5** — incompatible; keep app on Vite 8 |
| Language | `typescript` | **~6.0.2** | Stricter than TS 5.x; `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals` enabled |
| Canvas | `pixi.js` | **^8.9.1** | WebGL via Pixi v8 Application API (`await app.init`) |
| Viewport | `pixi-viewport` | **^6.0.3** | Declared compatible with Pixi 8; pin and smoke-test pan/wheel after every Pixi bump |
| CRDT | `yjs` | **^13.6.27** | No peer conflict with React; use `Y.UndoManager` tracked origins (implemented) |
| Sketch | `roughjs` | **^4.6.6** | Installed; sketch path uses custom `sketchStroke.ts` + sloppiness flag — RoughJS wiring still optional |
| Styling | `tailwindcss` + `@tailwindcss/vite` | **^4.3.0** | Align tokens with Figma `theme.css` deliberately, not automatically |
| Backend | FastAPI + stdlib `json` | `backend/main.py` | `POST /api/save`, `GET /api/load` + project aliases |

### 0.3 As-built inventory (what exists today)

| Capability | Location | Status |
|------------|----------|--------|
| Pixi canvas + viewport | `frontend/src/components/canvas/SpatialCanvas.tsx` | **Done** |
| Engine bridge | `frontend/src/engine/EngineContext.tsx` | **Done** (TS errors remain) |
| Yjs store + undo | `frontend/src/lib/state/StoreManager.ts` | **Done** |
| Schema v3 + entities | `frontend/src/lib/state/schema.ts` | **Done** |
| Tools + input FSM | `frontend/src/engine/input/CanvasInputController.ts` | **Partial** (type errors, text entity incomplete) |
| Document nodes (HTML overlay) | `frontend/src/engine/document/DocumentOverlayManager.ts` | **Done** (anchor math weak — see §4) |
| Spatial links | `frontend/src/lib/spatial/linkAnchorResolver.ts`, `SpatialLinksLayer.ts` | **Partial** (approximate layout) |
| Plugin registry | `frontend/src/plugins/pluginRegistry.ts` | **Done** |
| Backend plugins | `backend/modules/loader.py` | **Done** (`/api/plugins/{name}`) |
| Viewport culling + LOD | `frontend/src/engine/render/RenderManager.ts` | **Done** |
| Persistence + tldraw migrator | `canvasPersistence.ts`, `legacyMigrator.ts` | **Done** |
| tldraw runtime | — | **Removed** from `package.json` ✓ |
| `npm run build` (`tsc -b && vite build`) | — | **FAILS** (29+ TS errors) |
| `npx vite build` only | — | **Passes** (typecheck bypassed) |

### 0.4 Critical contradiction resolved

| Old plan statement | Reality |
|--------------------|---------|
| “Planning only — no code until approval” | Code migration **already landed** |
| “Phase 1 = remove tldraw” | **Already removed** |
| “Phase 6 = persistence” | **`canvasPersistence.ts` + `/api/save` exist** |
| “Phase 5 = culling first” | **RenderManager shipped before formal doc update** |

**New rule:** Treat **Phase 0** below as a **hard gate**. No feature phase is “complete” until Phase 0 CI green.

---

## Phase 0 — Pre-Flight Safety Fixes (MANDATORY GATE)

**Goal:** Make the as-built engine **compile-clean**, **visually aligned with Figma chrome**, and **safe for spatial-link math** before any new feature work.

**Estimated effort:** 1–2 days.

### 0.1 Dependency & type collision audit

#### 0.1.1 Verified compatible (no action unless bumping)

- **Pixi 8 + pixi-viewport 6:** Used in `SpatialCanvas.tsx` with `Viewport({ events: app.renderer.events })` — correct v8 pattern.
- **Yjs + React 19:** Store lives outside React render; `EngineContext` subscribes coarsely — OK.
- **Radix + React 19:** Already in use across TopBar, Settings, toolbar.

#### 0.1.2 Active risks

| Risk | Evidence | Mitigation |
|------|----------|------------|
| **TypeScript 6 + strict flags** | `tsconfig.app.json`: `noUnusedLocals`, `verbatimModuleSyntax`, `erasableSyntaxOnly` | Fix or explicitly suppress per-file only after justification |
| **Pixi patch drift** | Minor API differences (`Graphics` stroke, `Application.init`) | Lock versions in `package.json`; add `engines` field; document upgrade playbook |
| **Figma folder ≠ app deps** | Figma: React 18, Vite 6, MUI, cmdk, recharts, etc. | **Never merge** Figma `package.json`; port **components + CSS tokens** only |
| **`npm run build` ≠ `vite build`** | `npm run build` runs `tsc -b` first and **fails** | Phase 0 must green `tsc -b` |

#### 0.1.3 Exact version policy (add to `frontend/package.json` comments or `engines`)

```json
{
  "engines": { "node": ">=20" },
  "dependencies": {
    "pixi.js": "^8.9.1",
    "pixi-viewport": "^6.0.3",
    "yjs": "^13.6.27",
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  }
}
```

After any `pixi.js` upgrade: run pan/zoom wheel test, PNG export, and document overlay sync.

### 0.2 Figma UI integration gaps (`ui figma new/`)

**Reference layout (Figma export):**

| Element | Figma positioning | Current app (`App.tsx`) | Gap |
|---------|-------------------|-------------------------|-----|
| Canvas | `absolute inset-0` placeholder, no z-index | `SpatialCanvas` `z-0` full screen | OK structurally |
| TopBar | `fixed top-6 left-1/2 z-50` | Flex header inside `z-50` overlay | OK; verify vertical offset matches `top-24` sidebars |
| Sidebars | `fixed left/right-6 top-24 z-40` | Flex columns `max-h-[calc(100vh-140px)]` | **Different layout model** — flex center spacer vs fixed side rails |
| Bottom toolbar | `fixed bottom-8 z-50` | Footer flex center | OK |
| Settings modal | `z-[100]` / `z-[101]` | `z-50` relative | **Modal may render under overlay** — raise to `z-[100]` |
| Theme | `src/styles/theme.css` (oklch) | `frontend/src/styles/theme.css` | Diff tokens — run visual diff |

#### 0.2.1 Required Phase 0 UI setup (prevent clipping / wheel steal)

1. **Z-index contract** (document in `frontend/src/styles/index.css`):

   ```txt
   z-0   : Pixi canvas (SpatialCanvas root)
   z-2   : Document HTML overlay (.dv-document-overlay-root) — inside canvas container
   z-1   : Ambient gradient (pointer-events-none)
   z-40  : Sidebars (if switched to fixed Figma layout)
   z-50  : TopBar, BottomToolbar, Minimap
   z-100 : Modals (Settings, dialogs)
   ```

2. **Pointer-events contract** (already partially applied):

   - Outer chrome: `pointer-events-none` container + `pointer-events-auto` on interactive children.
   - Pixi viewport: `touch-action: none` on canvas (present).
   - Document shell: `pointer-events: auto` only when not in greeked LOD mode (implemented in `DocumentOverlayManager`).

3. **Wheel routing:** Ensure `pixi-viewport` wheel plugin does not scroll page when cursor over sidebars — test with `overscroll-behavior: none` on `html, body` (add if missing).

4. **Token merge checklist:** Copy from Figma → app only:

   - `--font-*`, glass card borders, `#2F80ED` accent (already used in chrome)
   - Do **not** import MUI / emotion from Figma package

5. **Layout decision (pick one in Phase 0):**

   - **Option A (keep flex):** Retain current flex shell; tune `top-24` / `140px` offsets to match Figma spacing.
   - **Option B (Figma-fixed):** Refactor `App.tsx` to `fixed` sidebars like Figma; keep center as dead zone for canvas.

### 0.3 Build system validation & cleanup routine

**Current failure:** `npm run build` → `tsc -b` reports errors in:

- Orphan **shadcn** stubs: `calendar`, `carousel`, `chart`, `command`, `drawer`, `form`, `input-otp`, `resizable`, `sidebar`, `sonner` — missing `react-day-picker`, `embla-carousel-react`, `recharts`, `cmdk`, `vaul`, `react-hook-form`, `input-otp`, `react-resizable-panels`, `next-themes`, `sonner`
- **Engine:** `EngineContext.tsx` (`refreshDocumentLayers` undefined, unused import)
- **SpatialCanvas:** bridge signature mismatch, `destroy` on chrome handle, `applyGesturePreview` return type
- **CanvasInputController:** `DocumentNodeEntity` required fields, `BoardEntityPatch` missing `endX`/`endY`
- **usePluginPropertyPanels:** references `engine.revision` not exposed on context

#### 0.3.1 Step-by-step cleanup (execute in order)

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Create `frontend/src/components/ui/_archive/` | Folder exists |
| 2 | Move unused shadcn files (list above) to `_archive/` **or** delete | `rg "from './ui/calendar" src` → no matches |
| 3 | Update `tsconfig.app.json`: `"exclude": ["src/components/ui/_archive"]` | `tsc -b` no missing module errors from ui |
| 4 | Fix engine TS errors (see §0.4) | `tsc -b` engine clean |
| 5 | Run `npm run lint` and fix blocking issues | ESLint pass |
| 6 | Run `npm run build` | Full green |
| 7 | Add CI script: `npm run build` on PR | Prevents regression |

**Alternative (not recommended):** Install all missing peer deps — bloats bundle for unused UI.

#### 0.3.2 `tsconfig.app.json` recommended exclusions

```json
{
  "include": ["src"],
  "exclude": [
    "src/components/ui/_archive",
    "src/**/*.test.ts"
  ]
}
```

Keep `noUnusedLocals: true` — forces dead code removal.

### 0.4 Phase 0 engineering fixes (explicit file targets)

| File | Issue | Fix specification |
|------|-------|-------------------|
| `EngineContext.tsx` | `refreshDocumentLayers` called but not in context | Implement wrapper calling `documentLayersRef.current?.syncAll()` or remove call |
| `EngineContext.tsx` | `exportEntitiesToSvg` unused | Remove import or wire to export menu |
| `SpatialCanvas.tsx` | `appendFreehandPoints` bridge arity | Match `CanvasInputBridge` type to 3-arg engine API |
| `DocumentChromeLayer.ts` | Handle type missing `destroy` | Return `destroy` from `mountDocumentChromeLayer` |
| `CanvasInputController.ts` | Text tool creates incomplete `document` entity | Use `createDocumentNode` helper with `title`, `plainText`, `blocks`, `scrollY` |
| `schema.ts` / patch types | `endX`/`endY` not on `BoardEntityPatch` | Extend patch union for line/arrow |
| `usePluginPropertyPanels.ts` | `engine.revision` | Expose `revision` on `EngineContextValue` or subscribe via `engine.subscribe` only |
| `EntityLayer.ts` | Unused `visibleIds` | Remove or use |
| `canvasExport.ts` | Pixi API type mismatches | Align with Pixi 8 `extract` options |

### 0.5 Phase 0 testing checkpoint

- [ ] `npm run build` exits 0 (not only `vite build`)
- [ ] App boots: pan/zoom 60 FPS empty + 1k rectangles
- [ ] Save → Load round-trip (`/api/save`, `/api/load`) on DVAMOCLES schema
- [ ] Load legacy `backend/data/projects/untitled-project-1.json` (tldraw shell) without crash
- [ ] Sidebars scroll inside `max-h-[calc(100vh-140px)]`; no clipping at 1080p / 1440p
- [ ] Settings modal above all chrome (z-index)
- [ ] Document overlay receives wheel only when hovered (no page scroll bleed)

---

## 1. Salvage & Purge Strategy (updated)

### 1.1 KEEP (current — do not delete)

All paths listed in v1 plan **except** tldraw adapters (already gone). Additionally keep:

- `frontend/src/lib/state/*` (StoreManager, schema, entityCodec, canvasPersistence, legacyMigrator)
- `frontend/src/engine/**` (render, input, document, plugins integration)
- `frontend/src/plugins/**`
- `backend/modules/**`

### 1.2 PURGE (remaining)

| Target | Action |
|--------|--------|
| `frontend/src/components/ui/{calendar,carousel,chart,...}` | Archive or delete (Phase 0) |
| Stub re-exports: `DvamoclesOverlay`, `FloatingToolbar`, `ProjectNavigation`, `ImportAssets`, `TopRightStatus` | Delete if zero imports (`rg`) |
| `frontend/src/components/properties/tldrawColors.ts` | Rename → `enginePalette.ts` if still present |

### 1.3 DO NOT PURGE (audit correction)

| Target | Reason |
|--------|--------|
| `TopLeftMenu.tsx` | Exports persistence + migrator API — keep |
| `RenderManager.ts` | Production performance path |
| `legacyMigrator.ts` | Required for old customer projects |

---

## 2. Target architecture (as-built vs target)

```txt
frontend/src/
├── App.tsx                     # Flex overlay + SpatialCanvas z-0
├── components/                 # React chrome (TopBar, sidebars, toolbar)
├── engine/
│   ├── EngineContext.tsx       # Bridge (store exposed)
│   ├── infiniteGrid.ts
│   ├── input/                  # CanvasInputController, hitTest, file drop
│   ├── render/                 # EntityLayer, RenderManager, LOD, Preview
│   └── document/               # Chrome + HTML overlay
├── lib/
│   ├── state/                  # Yjs StoreManager, schema v3
│   ├── spatial/                # Hash grid, bounds, link anchors
│   └── document/               # layoutDocumentNode (approximate)
├── plugins/                    # manifest glob registry
└── contracts/styles.ts

backend/
├── main.py                     # save/load + CORS
└── modules/                    # plugin routers
```

**Not yet implemented (still aligned with master doc):**

- `rbush` / dedicated quadtree package (hash grid used instead)
- `engine/history/HistoryController.ts` as separate module (logic inside StoreManager)
- Backend append-only delta log (snapshots only today)
- AI/RAG runtime (forbidden until performance + persistence gates green per master §15)

---

## 3. Spatial text mapping — edge cases & Phase 4 mitigation

### 3.1 Problem statement (audit)

Current pipeline:

1. **Rendering:** Real HTML in `DocumentOverlayManager` (`.dv-document-body`) with CSS wrap.
2. **Layout model:** `layoutDocumentNode()` in `documentLayout.ts` uses **heuristic** wrap (`fontSize * 0.55` per char) — **not identical** to browser layout.
3. **Link anchors:** `charRangeToWorldRect()` → `resolveSourceAnchor()` → Bézier in `linkAnchorResolver.ts`.

**Failure modes:**

| Event | Symptom |
|-------|---------|
| Resize document width | HTML reflow changes line breaks; `charRange` still valid in `plainText` but **pixel anchor drifts** |
| Scroll `scrollY` | Partially handled in `charRangeToWorldRect` — OK if layout matches DOM |
| Zoom (LOD greeking) | Links hidden or anchors stale — acceptable if links hidden at low zoom |
| Edit `plainText` / blocks without relayout | Orphan `charRange` on spatial links |
| Multi-line selection | `computeSelectionCharRange` fallback in overlay may disagree with layout model |

### 3.2 Bulletproof anchor strategy (required for Phase 4 completion)

**Principle:** Persist **`charRange` in plainText** (stable) + compute **pixels from DOM at link-render time** (ephemeral).

#### 3.2.1 Data model additions (`schema.ts`)

```ts
interface SpatialLink {
  id: string;
  sourceDocumentId: string;
  charRange: [number, number];     // canonical — never store pixel coords
  targetShapeId: string;
  label?: string;
  anchorVersion?: number;          // bump when document blocks change
}
```

On document `blocks` / `plainText` mutation: increment `document.anchorVersion` and emit `links-invalidated`.

#### 3.2.2 `CharacterAnchorIndex` (new: `frontend/src/lib/document/characterAnchorIndex.ts`)

**API:**

```ts
interface LayoutGlyphBox {
  charStart: number;
  charEnd: number;
  worldRect: { x: number; y: number; width: number; height: number };
}

function measureCharacterBoxes(
  shell: HTMLElement,           // .dv-document-shell
  entity: DocumentNodeEntity,
  viewport: Viewport,
): LayoutGlyphBox[];

function charRangeToWorldRectDom(
  entity: DocumentNodeEntity,
  charRange: [number, number],
  shell: HTMLElement,
  viewport: Viewport,
): CharRangeRect | null;
```

**Algorithm (normative):**

1. Ensure shell is mounted and `display !== none` (temporarily force `visibility:hidden` off-screen if greeked — or skip link draw when LOD greeked).
2. Walk `plainText` char indices; for each block boundary, map to DOM text nodes via `data-block-id` + `data-plain-start` attributes on block roots.
3. Use `document.createRange()` + `range.setStart` / `setEnd` on Text nodes.
4. Call `range.getClientRects()` → union rects.
5. Convert each client rect → world space:

   ```ts
   const tl = viewport.toWorld(clientX - canvasRect.left, clientY - canvasRect.top);
   ```

6. Apply **scroll correction:** add `entity.x/y`, subtract `body.scrollTop` already reflected in client rects if measured inside scrolled body.

7. Cache per `(documentId, anchorVersion, scrollY, width, height, zoom)` in `WeakMap` invalidated on overlay `syncAll`.

#### 3.2.3 Resize mitigation

On `updateEntity` changing `width` / `height` / `blocks`:

1. Re-run `measureCharacterBoxes` after `requestAnimationFrame` (post-layout).
2. Do **not** mutate `charRange` — only update rendered link geometry.
3. Optional: show ghost anchor handles in select tool using same DOM measurement.

#### 3.2.4 Fallback when DOM unavailable

If shell not mounted (export/offscreen): use `layoutDocumentNode()` **but** mark links as `confidence: 'approximate'` in dev overlay.

### 3.3 Phase 4 work items (spatial document mapping — expanded)

**Status today:** Document drop, overlay, chrome, links — **Partial**.

| # | Task | Acceptance |
|---|------|------------|
| 4.1 | Implement `characterAnchorIndex.ts` per §3.2 | Link endpoints match text within **2px** at 100% zoom after resize |
| 4.2 | Wire `SpatialLinksLayer` + `linkAnchorResolver` to DOM measurement | Replace `charRangeToWorldRect` heuristic as primary |
| 4.3 | `blocks` edit invalidation | Changing text bumps `anchorVersion`; links re-sync |
| 4.4 | Link tool UX | Selection → pending source → target shape (exists); add visual feedback at measured rect |
| 4.5 | Left sidebar outline | List documents + linked shapes (stub today) |
| 4.6 | Regression tests | Golden DOM fixture: 3 blocks, resize width 400→200, charRange `[10,25]` stable |

---

## 4. Execution phases (reconciled with as-built)

Phases marked: ✅ Done · 🟡 Partial · ⬜ Not started

---

### Phase 1 — Dependency purge & Pixi engine swap ✅

**Delivered:** `SpatialCanvas`, `pixi.js` 8, `pixi-viewport`, no tldraw, `EngineProvider`, infinite grid.

**Remaining:** Phase 0 TS/build green; Figma z-index parity.

---

### Phase 2 — Yjs world state + undo ✅

**Delivered:** `StoreManager`, `Y.Map` entities + spatialLinks, `UndoManager`, gesture origins, `exportWorldDocument` / `importWorldDocument`.

**Remaining:** Optional `encodeStateAsUpdate` for collaboration (future).

---

### Phase 3 — UI re-wire to engine 🟡

**Delivered:** Toolbar, properties, selection, save/load hooks, minimap bound to engine.

**Gaps:**

- `AlignmentSection` — verify engine `alignEntities` exists or stub disabled
- Text tool — `DocumentNodeEntity` creation incomplete (TS proves gap)
- Line tool adjacent to draw — OK in toolbar

---

### Phase 4 — Spatial document mapping + link anchors 🟡

See §3.3 — **DOM anchor index is the critical missing piece.**

---

### Phase 5 — Performance (culling, LOD, spatial index) ✅

**Delivered:** `SpatialHashGrid`, `RenderManager`, LOD at zoom < 0.3, lazy entity paint.

**Gaps:**

- Quadtree / `rbush` for marquee selection — not shipped (hash grid only)
- GPU batching — not explicit; Pixi Graphics per entity
- Benchmark script — add `scripts/bench-5k.ts` for repeatable FPS

---

### Phase 6 — Plugin registry ✅

**Delivered:** `plugins/*/manifest.ts`, `pluginRegistry.ts`, dynamic toolbar + sidebar panels, `backend/modules` loader.

**Gaps:**

- Document shape type plugins — only core `document` type
- Plugin security model — trust-all (dev only)

---

### Phase 7 — Persistence & legacy migration ✅

**Delivered:** `serializeCanvasState`, `/api/save`, `/api/load`, `legacyMigrator.ts`, `TopBar` save/open.

**Gaps:**

- Backend **delta log** not implemented (full snapshot only)
- `schemaVersion` doc says v1 in old prompt but code uses **v3** — document as v3 everywhere
- Python-side migrator duplicate (optional); client migrator sufficient for now

---

### Phase 8 — Hardening & release ⬜

1. Phase 0 green CI
2. Spatial anchor DOM pipeline (Phase 4 close-out)
3. README update (stack, no tldraw, dev commands)
4. E2E smoke: Playwright pan/zoom/save/load
5. Performance gate: 5k entities ≥55 FPS on reference GPU

---

## 5. Risk register (expanded)

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | `tsc -b` fails in CI while dev uses `vite` only | **High** | **High** | Phase 0 cleanup §0.3 |
| R2 | Char-range vs HTML layout drift | **High** | **High** | §3.2 DOM anchor index |
| R3 | Figma fixed vs flex layout mismatch | Med | Med | Pick layout option §0.2.1; visual QA |
| R4 | Pixi wheel vs sidebar scroll conflict | Med | Med | `touch-action`, pointer-events audit |
| R5 | Legacy tldraw migrator incomplete shapes | Med | Med | Expand `legacyMigrator.ts` mapping table; log skipped types |
| R6 | `npm run build` / TS 6 strictness | Med | Med | Incremental fixes; no `skipLibCheck` abuse |
| R7 | Document overlay memory (5k docs) | Low | High | Cap DOM shells via culling (display:none off-screen) — partial |
| R8 | Yjs undo + gesture race | Low | Med | `commitGesture` already transactional — add test |
| R9 | Plugin manifest XSS / arbitrary code | Low | High | Trust boundary doc; signed plugins later |
| R10 | Schema v3 breaking old saves | Med | Med | `normalizeProjectPayload` + version field |
| R11 | No delta persistence — large save payloads | Med | Med | Phase 8 delta log per master §9 |
| R12 | AI features before perf gate | Med | **Critical** | Master §15 — block until Phase 8 perf checkpoint |

---

## 6. Testing checkpoints (updated)

| Phase | Gate |
|-------|------|
| **0** | `npm run build` green; modal z-index; wheel routing; save/load + legacy load |
| 1 | No tldraw in bundle; 60 FPS pan/zoom |
| 2 | 1k entities; undo/redo |
| 3 | All tools; properties; minimap |
| 4 | DOM anchors ±2px after resize; links track scroll |
| 5 | 5k entities ≥55 FPS; culled count < total |
| 6 | Plugin drop-in without `App.tsx` edit |
| 7 | tldraw JSON migrates; round-trip |
| 8 | CI + README + E2E |

---

## 7. Execution prompts (revised)

### Phase 0 prompt (run first)

```txt
@workspace @docs @MIGRATION_PLAN.md

Execute Phase 0 ONLY: Pre-Flight Safety Fixes.

1. Archive or delete unused shadcn ui stubs; exclude _archive from tsconfig.
2. Fix all TypeScript errors so `npm run build` passes (EngineContext, SpatialCanvas, CanvasInputController, patches).
3. Align Settings modal z-index to z-[100]; document z-index contract in styles.
4. Expose engine.revision OR fix usePluginPropertyPanels subscription.
5. Do NOT add features. Verify checklist §0.5.
```

### Phase 4 prompt (spatial anchors)

```txt
@workspace @docs @MIGRATION_PLAN.md §3.2

Implement characterAnchorIndex.ts per MIGRATION_PLAN §3.2.2:
- DOM Range + getClientRects → world space via viewport.toWorld
- Wire linkAnchorResolver / SpatialLinksLayer to use DOM measurement
- Invalidate cache on anchorVersion, scrollY, resize
- Keep charRange in plainText as canonical

Verify: resize document 400→200px, link stays on selected text within 2px.
```

---

## 8. Human review checklist (before declaring migration complete)

- [ ] Phase 0 CI green (`npm run build`)
- [ ] DOM anchor strategy approved (§3.2)
- [ ] Figma layout option chosen (flex vs fixed)
- [ ] Schema version **3** documented in README + API
- [ ] Legacy tldraw projects: acceptable loss list for unmigrated shape types
- [ ] Performance gate measured (5k entities)
- [ ] AI/RAG remains out of scope until Phase 8

---

## 9. Appendix — file cross-reference index

| Concern | Primary files |
|---------|----------------|
| Canvas runtime | `SpatialCanvas.tsx`, `EntityLayer.ts`, `RenderManager.ts` |
| State | `StoreManager.ts`, `schema.ts`, `entityCodec.ts` |
| Persistence | `canvasPersistence.ts`, `backend/main.py` |
| Legacy | `legacyMigrator.ts`, `backend/data/projects/*.json` |
| Plugins | `pluginRegistry.ts`, `backend/modules/loader.py` |
| Document text | `DocumentOverlayManager.ts`, `documentLayout.ts`, `linkAnchorResolver.ts` |
| Figma reference | `ui figma new/Modular UI for DVAMOCLES SWORD/src/app/**` |
| Build | `tsconfig.app.json`, `eslint.config.js`, `package.json` |

---

*End of MIGRATION_PLAN v2.0-audit. Next mandatory action: **Phase 0 Pre-Flight** (§Phase 0).*

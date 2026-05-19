# DVAMOCLES SWORD™
## Master Architecture Summary & Cursor-Driven Development Guidelines

---

# 1. VISIONE DEL PROGETTO

DVAMOCLES SWORD™ NON deve essere progettato come:

- una semplice whiteboard;
- un clone di Excalidraw;
- un canvas con AI appiccicata sopra.

L’obiettivo reale è costruire:

> Un runtime cognitivo spaziale locale, privacy-first e AI-native.

La differenza fondamentale è che:

- Excalidraw disegna forme;
- DVAMOCLES costruisce relazioni semantiche spaziali.

Il progetto deve evolvere verso:

- Spatial Document Mapping;
- Semantic Linking;
- Local AI Workspace;
- Knowledge Graph Runtime;
- Visual RAG Environment.

---

# 2. DIREZIONE ARCHITETTURALE DEFINITIVA

## Filosofia Core

Separare SEMPRE:

```txt
UI React
≠
Canvas Runtime
≠
Data Model
≠
AI Runtime
```

Errore mortale:

```txt
React gestisce tutto
```

Architettura corretta:

```txt
React = UI Layer
Canvas Engine = Rendering Runtime
Python Backend = Persistence + AI Orchestration
```

---

# 3. STACK TECNOLOGICO RACCOMANDATO

## Frontend

### React + Vite
Perfetto da mantenere.

---

## Rendering Engine

### Raccomandazione Finale:

# PixiJS + Custom Runtime

Motivi:

- WebGL hardware accelerated;
- batching enorme;
- scene massive;
- rendering custom;
- ottimo per semantic zooming;
- perfetto per layered rendering;
- MIT License;
- compatibile con runtime altamente custom.

---

## UI Layer

Continuare con:

- Radix UI;
- Tailwind;
- floating cards modulari.

---

## Backend

### Python + FastAPI

Da mantenere.

Perfetto per:

- orchestrazione AI;
- embeddings;
- indexing;
- persistence;
- local RAG;
- plugin AI.

---

# 4. ARCHITETTURA CONCETTUALE DEFINITIVA

```txt
React UI Layer
    ↓
Canvas Runtime Controller
    ↓
World State Engine
    ↓
Spatial Indexing
    ↓
Viewport Query
    ↓
LOD Resolver
    ↓
GPU Batch Builder
    ↓
PixiJS Renderer
```

---

# 5. FILOSOFIA FONDAMENTALE

## DATA-ORIENTED ARCHITECTURE

NON progettare:

```txt
component-per-shape
```

Progettare:

```txt
world database
+
render systems
+
entity processing
```

Ogni shape NON è:

```txt
un componente React
```

ma:

```txt
un'entità renderizzabile
```

---

# 6. DOCUMENT NODE = CUORE DEL SOFTWARE

Questa è la feature realmente differenziante.

## Il Document Node NON è:

- una textarea;
- markdown renderizzato;
- HTML dentro il canvas.

## Deve essere:

```txt
Semantic AST Runtime
```

---

# Pipeline Corretta

```txt
Raw File
↓
Parser
↓
AST Semantico
↓
Layout Engine
↓
Renderable Blocks
↓
Canvas Rendering
```

---

# Ogni blocco deve avere:

```txt
stable semantic ID
```

Esempio:

```json
{
  "blockId": "blk_001",
  "type": "paragraph"
}
```

---

# 7. BIDIRECTIONAL LINKING

Questa è la vera killer feature.

Il sistema NON deve linkare:

```txt
shape ↔ documento
```

ma:

```txt
shape ↔ range semantico persistente
```

---

# Struttura corretta

```json
{
  "documentId": "doc_42",
  "blockId": "blk_001",

  "range": {
    "start": 120,
    "end": 248
  }
}
```

---

# Risultato futuro

DVAMOCLES potrà:

- costruire knowledge graph;
- creare semantic overlays;
- fare citation linking;
- AI referencing;
- contextual retrieval.

---

# 8. PERFORMANCE ARCHITECTURE

## Regola assoluta:

NON renderizzare:

```txt
ciò che l’utente non vede
```

---

# Sistemi obbligatori

## Spatial Hashing
Per lookup realtime.

## Quadtree
Per viewport culling.

## Semantic Zooming
Per ridurre dettaglio dinamicamente.

## GPU Batching
Per draw calls minimali.

## Layered Rendering
Separare:

- background;
- grid;
- edges;
- nodes;
- overlays.

---

# 9. TIME MACHINE SYSTEM

## Undo/Redo

NON usare snapshot completi.

Usare:

```txt
Action-Based History
+
Delta-Based Persistence
```

---

# Esempio

```json
{
  "type": "MOVE_NODE",

  "before": {
    "x": 100,
    "y": 200
  },

  "after": {
    "x": 500,
    "y": 700
  }
}
```

---

# Backend Persistence

```txt
Snapshots
+
Incremental Deltas
+
Atomic Save
```

---

# 10. PLUGIN ECOSYSTEM

DVAMOCLES deve nascere plugin-first.

---

# Frontend

```txt
/plugins
```

Ogni plugin deve poter:

- registrare tools;
- registrare panel;
- registrare shape;
- registrare renderer;
- registrare AI actions.

---

# Backend

Ogni modulo FastAPI:

```txt
/backend/modules
```

con router isolati.

---

# 11. AI ARCHITECTURE

L’AI NON deve essere:

```txt
una chat laterale
```

Errore enorme.

---

# Deve essere:

```txt
spatially integrated
```

---

# Pipeline futura

```txt
Document AST
↓
Chunking
↓
Embeddings
↓
Vector Store
↓
Spatial Semantic Graph
↓
Canvas Interaction
```

---

# 12. UX PHILOSOPHY

## Estetica

Target:

- Linear;
- Excalidraw;
- Obsidian;
- Figma;
- Raycast.

---

# Principi UX

## Zero clutter

## Floating modular cards

## Spatial focus

## Keyboard-first workflow

## Semantic navigation

## Dark premium minimalism

---

# 13. LINEE GUIDA FONDAMENTALI PER CURSOR

Questa è la parte più importante.

Cursor va usato come:

```txt
acceleratore operativo
```

NON come:

```txt
autopilot totale
```

---

# STRATEGIA CORRETTA CON CURSOR

## MAI chiedere:

```txt
“fammi l’intera app”
```

Errore devastante.

---

# INVECE

Scomporre tutto in:

```txt
micro-sistemi isolati
```

---

# ESEMPIO CORRETTO

## Sprint 1

Camera Runtime

## Sprint 2

Selection System

## Sprint 3

Spatial Hash Grid

## Sprint 4

Document AST Parser

## Sprint 5

Virtualized Text Renderer

---

# REGOLA CRITICA

Ogni prompt Cursor deve avere:

## 1. Contesto tecnico

## 2. Obiettivo preciso

## 3. Vincoli architetturali

## 4. Cosa NON fare

## 5. Output atteso

---

# ESEMPIO PROMPT CORRETTO

```txt
Ruolo:
Sei un Senior Graphics Engineer.

Contesto:
Sto sviluppando DVAMOCLES SWORD™, un runtime canvas WebGL-based usando PixiJS.

Task:
Implementa un Spatial Hash Grid system.

Vincoli:
- No React rendering.
- Runtime imperative.
- Supporto 100k entities.
- O(1) average lookup.
- TypeScript strict.

Output:
- grid.ts
- query system
- insertion/removal
- viewport query
```

---

# 14. STRATEGIA DI SVILUPPO

## FASE 1 — FOUNDATION

Costruire:

- camera system;
- viewport;
- rendering;
- selection;
- input;
- world state.

---

## FASE 2 — DOCUMENT SYSTEM

Costruire:

- AST parser;
- block renderer;
- text layout;
- virtual scrolling.

---

## FASE 3 — SEMANTIC LINKING

Costruire:

- link registry;
- anchor resolver;
- overlay renderer.

---

## FASE 4 — AI INTEGRATION

Costruire:

- embeddings;
- vector store;
- retrieval;
- semantic graph.

---

## FASE 5 — EXTENSIBILITY

Costruire:

- plugin runtime;
- addon SDK;
- module registry.

---

# 15. ERRORI DA EVITARE ASSOLUTAMENTE

## 1. React-heavy rendering

Distrugge performance.

---

## 2. DOM overlay ovunque

Collassa con documenti enormi.

---

## 3. Full JSON snapshots continui

Memory leak enorme.

---

## 4. Proprietary formats

Blocca evoluzione futura.

---

## 5. AI integration troppo presto

Prima:

- runtime;
- rendering;
- persistence;
- data model.

Poi AI.

---

# 16. DIREZIONE FUTURA REALE

DVAMOCLES può realisticamente evolvere verso:

- Spatial IDE;
- Visual RAG Workspace;
- AI Research Environment;
- Technical Design OS;
- Knowledge Graph Editor;
- Local AI Operating System.

---

# 17. CONCLUSIONE FINALE

La vera identità del progetto NON è:

```txt
whiteboard + AI
```

ma:

```txt
Spatial Cognitive Runtime
```

Ed è importante perché cambia completamente:

- architettura;
- rendering;
- persistence;
- UX;
- AI integration;
- scalabilità.

DVAMOCLES NON deve essere progettato come:

```txt
un’app React con canvas
```

ma come:

```txt
un engine realtime cognitivo con React sopra.
```


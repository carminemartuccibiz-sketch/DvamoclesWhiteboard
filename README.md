# DVAMOCLES SWORD™: Whiteboard

**DVAMOCLES SWORD™: Whiteboard** is an infinite-canvas drawing application that pairs a custom Figma-designed interface with the [tldraw](https://tldraw.dev) whiteboard engine. The product is built with a strictly **system-agnostic** architecture: the UI, state layer, and canvas integration are decoupled from any single operating system so the same codebase can be packaged and deployed on Windows, macOS, Linux, or the web without rewriting core logic. Windows is the initial target platform; portability is a first-class design constraint.

## Features

- Full-screen **tldraw** canvas with native UI hidden (`hideUi`)
- Custom floating chrome: top menu, left sidebar, bottom toolbar, properties panel
- Live **properties panel** wired to tldraw selection and style APIs (color, fill, stroke, opacity)
- Light / dark mode synced to the canvas color scheme
- Figma-exported UI layered above the canvas with `useEditor` context

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, TypeScript |
| Build | Vite 8 |
| Canvas | Tldraw v3 |
| Styling | Tailwind CSS v4 |
| Components | Radix UI, Lucide icons |

## Project Structure

```
Dvamocles-Whiteboard/
├── frontend/                 # Vite + React application
│   ├── src/
│   │   ├── App.tsx           # Tldraw host + overlay layout
│   │   ├── components/       # Figma UI + PropertiesPanel
│   │   └── styles/           # Global CSS (incl. watermark override)
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm 10+

### Install & run

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

### Production build

```bash
cd frontend
npm run build
npm run preview
```

### Clear Vite dependency cache (if HMR or tldraw imports break)

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
npm run dev -- --force
```

## Architecture Notes

- **Canvas**: `<Tldraw hideUi>` from the unified `tldraw` package only (not `@tldraw/editor` directly). Overlay components are rendered as children so `useEditor()` is available everywhere in the custom UI.
- **Styles**: Shape properties use tldraw style props (`DefaultColorStyle`, `DefaultFillStyle`, `DefaultDashStyle`, `DefaultSizeStyle`) via `setStyleForNextShapes` and `setStyleForSelectedShapes`.
- **System-agnostic**: No Win32-specific APIs in the app layer; deployment targets are chosen at packaging time, not baked into the React source.

## License

See repository license terms. tldraw is subject to its own [license](https://github.com/tldraw/tldraw/blob/main/LICENSE.md); the development watermark is hidden in this project via CSS for local builds only—ensure compliance before public distribution.

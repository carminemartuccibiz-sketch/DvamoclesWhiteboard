import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import {
  useEngine,
  CANVAS_BG_DARK,
  CANVAS_BG_LIGHT,
  type CameraState,
  type ViewportController,
} from '../../engine/EngineContext';
import { createInfiniteGridLayer } from '../../engine/infiniteGrid';
import { mountEntityLayer } from '../../engine/render/EntityLayer';
import { mountPreviewLayer } from '../../engine/render/PreviewLayer';
import { mountSpatialLinksLayer } from '../../engine/render/SpatialLinksLayer';
import { mountDocumentChromeLayer } from '../../engine/document/DocumentChromeLayer';
import { mountDocumentOverlayManager } from '../../engine/document/DocumentOverlayManager';
import {
  mountCanvasInputController,
  type CanvasInputBridge,
} from '../../engine/input/CanvasInputController';
import { mountCanvasFileDrop } from '../../engine/input/mountCanvasFileDrop';
import { createRenderManager } from '../../engine/render/RenderManager';
import type { DocumentNodeEntity } from '../../lib/state/schema';

const MIN_ZOOM = 0.08;
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.15;

export function SpatialCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engine = useEngine();
  const engineRef = useRef(engine);
  engineRef.current = engine;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let app: Application | null = null;
    let viewport: Viewport | null = null;
    let renderManager: ReturnType<typeof createRenderManager> | null = null;
    let gridLayer: ReturnType<typeof createInfiniteGridLayer> | null = null;
    let gridDestroy: (() => void) | null = null;
    let unsubUi: (() => void) | null = null;
    let entityLayerDestroy: (() => void) | null = null;
    let previewDestroy: (() => void) | null = null;
    let inputDestroy: (() => void) | null = null;
    let chromeDestroy: (() => void) | null = null;
    let overlayDestroy: (() => void) | null = null;
    let linksDestroy: (() => void) | null = null;
    let fileDropDestroy: (() => void) | null = null;

    let entityLayerHandle: { syncAll: () => void } | null = null;
    let documentOverlayHandle: { syncAll: () => void } | null = null;
    let linksLayerHandle: { sync: () => void } | null = null;
    let documentChromeHandle: {
      sync: (entities: DocumentNodeEntity[], selected: ReadonlySet<string>) => void;
    } | null = null;

    const syncCameraFromViewport = () => {
      if (!viewport) return;
      const next: CameraState = {
        x: viewport.center.x,
        y: viewport.center.y,
        zoom: viewport.scale.x,
      };
      engineRef.current.setCamera(next);
      renderManager?.scheduleViewportFlush();
      documentOverlayHandle?.syncAll();
      linksLayerHandle?.sync();
      const docs = engineRef.current
        .getAllEntities()
        .filter((e): e is DocumentNodeEntity => e.type === 'document');
      documentChromeHandle?.sync(docs, engineRef.current.selectedIds);
    };

    const screenToWorld = (clientX: number, clientY: number) => {
      if (!app || !viewport) return { x: 0, y: 0 };
      const rect = app.canvas.getBoundingClientRect();
      return viewport.toWorld(clientX - rect.left, clientY - rect.top);
    };

    const bridge: CanvasInputBridge = {
      getActiveTool: () => engineRef.current.activeTool,
      getStyleDefaults: () => engineRef.current.styleDefaults,
      getSelectedIds: () => engineRef.current.selectedIds,
      setSelection: (ids) => engineRef.current.setSelection(ids),
      clearSelection: () => engineRef.current.clearSelection(),
      notifyChange: () => {
        entityLayerHandle?.syncAll();
        documentOverlayHandle?.syncAll();
        linksLayerHandle?.sync();
      },
      getAllEntities: () => engineRef.current.getAllEntities(),
      addEntity: (entity, options) => engineRef.current.addEntity(entity, options),
      deleteEntity: (id) => engineRef.current.deleteEntity(id),
      beginGesture: (id, entityIds) => engineRef.current.beginGesture(id, entityIds),
      commitGesture: () => engineRef.current.commitGesture(),
      cancelGesture: () => engineRef.current.cancelGesture(),
      registerGestureEntity: (id) => engineRef.current.registerGestureEntity(id),
      applyGesturePreview: (id, patch) => engineRef.current.applyGesturePreview(id, patch),
      appendFreehandPoints: (id, points, patch) =>
        engineRef.current.appendFreehandPoints(id, points, patch),
      getPendingLinkSource: () => engineRef.current.pendingLinkSource,
      completeSpatialLink: (targetId) => engineRef.current.completeSpatialLink(targetId),
    };

    const run = async () => {
      app = new Application();
      const initialDark = engineRef.current.isDarkMode;
      await app.init({
        resizeTo: container,
        background: initialDark ? CANVAS_BG_DARK : CANVAS_BG_LIGHT,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        powerPreference: 'high-performance',
      });

      if (disposed) {
        app.destroy(true, { children: true });
        return;
      }

      container.appendChild(app.canvas);
      app.canvas.style.display = 'block';
      app.canvas.style.width = '100%';
      app.canvas.style.height = '100%';
      app.canvas.style.touchAction = 'none';

      viewport = new Viewport({
        events: app.renderer.events,
        screenWidth: app.screen.width,
        screenHeight: app.screen.height,
        worldWidth: 1_000_000,
        worldHeight: 1_000_000,
      });

      viewport
        .drag({ wheel: false })
        .pinch()
        .wheel({ percent: 0.1, smooth: 8, interrupt: true })
        .decelerate({ friction: 0.92 })
        .clampZoom({ minScale: MIN_ZOOM, maxScale: MAX_ZOOM });

      viewport.moveCenter(0, 0);
      app.stage.addChild(viewport);

      renderManager = createRenderManager();
      renderManager.attachViewport(viewport);
      renderManager.rebuildIndex(engineRef.current.getAllEntities());

      gridLayer = createInfiniteGridLayer(viewport);
      gridLayer.setVisible(engineRef.current.showGrid);
      gridDestroy = gridLayer.destroy;

      const applyUiChrome = () => {
        if (!app) return;
        app.renderer.background.color = engineRef.current.isDarkMode
          ? CANVAS_BG_DARK
          : CANVAS_BG_LIGHT;
        gridLayer?.setVisible(engineRef.current.showGrid);
      };
      applyUiChrome();
      unsubUi = engineRef.current.subscribe(applyUiChrome);

      const entityLayer = mountEntityLayer(viewport, engineRef.current.store, {
        getSelectedIds: () => engineRef.current.selectedIds,
        renderManager,
      });
      entityLayerHandle = entityLayer;
      entityLayerDestroy = entityLayer.destroy;

      const preview = mountPreviewLayer(viewport);
      previewDestroy = preview.destroy;

      documentChromeHandle = mountDocumentChromeLayer(viewport, renderManager);
      chromeDestroy = documentChromeHandle.destroy;

      const linksLayer = mountSpatialLinksLayer(viewport, engineRef.current.store, renderManager);
      linksLayerHandle = linksLayer;
      linksDestroy = linksLayer.destroy;

      const overlay = mountDocumentOverlayManager(
        container,
        viewport,
        engineRef.current.store,
        {
          getSelectedIds: () => engineRef.current.selectedIds,
          setSelection: (ids) => engineRef.current.setSelection(ids),
          updateEntity: (id, patch) => {
            engineRef.current.updateEntity(id, patch);
            linksLayerHandle?.sync();
          },
          beginGesture: (id, ids) => engineRef.current.beginGesture(id, ids),
          commitGesture: () => {
            engineRef.current.commitGesture();
            linksLayerHandle?.sync();
          },
          applyGesturePreview: (id, patch) => engineRef.current.applyGesturePreview(id, patch),
          getPendingLinkSource: () => engineRef.current.pendingLinkSource,
          setPendingLinkSource: (s) => engineRef.current.setPendingLinkSource(s),
          getActiveTool: () => engineRef.current.activeTool,
        },
        renderManager,
      );
      documentOverlayHandle = overlay;
      overlayDestroy = overlay.destroy;

      engineRef.current.registerDocumentLayers({
        documentOverlay: overlay,
        linksLayer: linksLayer,
      });

      const input = mountCanvasInputController(app, viewport, bridge, preview);
      inputDestroy = input.destroy;
      engineRef.current.registerCanvasInput(input);
      input.setActiveTool(engineRef.current.activeTool);

      fileDropDestroy = mountCanvasFileDrop(container, {
        screenToWorld,
        addDocumentFromFile: (file, wx, wy) =>
          engineRef.current.importDocumentFile(file, wx, wy).then(() => {}),
      });

      engineRef.current.registerScene({ app, viewport });

      viewport.on('moved', syncCameraFromViewport);
      viewport.on('zoomed', syncCameraFromViewport);
      syncCameraFromViewport();

      const controller: ViewportController = {
        zoomIn: () => {
          const next = Math.min(viewport!.scale.x * ZOOM_STEP, MAX_ZOOM);
          viewport!.animate({ scale: next, time: 180, ease: 'easeOutCubic' });
        },
        zoomOut: () => {
          const next = Math.max(viewport!.scale.x / ZOOM_STEP, MIN_ZOOM);
          viewport!.animate({ scale: next, time: 180, ease: 'easeOutCubic' });
        },
        centerOn: (x, y) => viewport?.moveCenter(x, y),
        getVisibleBounds: () => {
          const b = viewport!.getVisibleBounds();
          return { minX: b.left, minY: b.top, maxX: b.right, maxY: b.bottom };
        },
        capturePng: async () => engineRef.current.capturePng(),
      };

      engineRef.current.registerViewport(controller);
    };

    void run();

    return () => {
      disposed = true;
      unsubUi?.();
      engineRef.current.registerCanvasInput(null);
      engineRef.current.registerViewport(null);
      engineRef.current.registerScene(null);
      engineRef.current.registerDocumentLayers(null);
      inputDestroy?.();
      fileDropDestroy?.();
      overlayDestroy?.();
      linksDestroy?.();
      chromeDestroy?.();
      previewDestroy?.();
      gridDestroy?.();
      entityLayerDestroy?.();
      renderManager?.destroy();
      viewport?.destroy({ children: true });
      if (app) {
        app.destroy(true, { children: true });
        if (app.canvas.parentElement === container) container.removeChild(app.canvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden"
      aria-label="DVAMOCLES spatial canvas"
    />
  );
}

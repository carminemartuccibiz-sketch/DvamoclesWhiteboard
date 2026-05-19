import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  getStoreManager,
  type StoreHistoryState,
  type StoreManager,
} from '../lib/state/StoreManager';
import type { Application } from 'pixi.js';
import type { Viewport } from 'pixi-viewport';
import {
  DOCUMENT_SCHEMA_VERSION,
  createSpatialLink,
  type BoardEntity,
  type BoardEntityPatch,
  type DvWorldDocument,
  type SpatialLink,
} from '../lib/state/schema';
import type { PendingLinkSource } from './document/DocumentOverlayManager';
import { buildDocumentEntityFromFile } from './input/mountCanvasFileDrop';
import { computeEntitiesBounds } from '../lib/spatial/canvasBounds';
import { exportViewportToPng } from '../lib/export/canvasExport';
import {
  DEFAULT_CANVAS_STYLE,
  type CanvasStyleDefaults,
} from './style/canvasStyleDefaults';
import type { DvColorStyle, DvFillStyle, DvSizeStyle } from '../contracts/styles';
import type { SloppinessUi } from '../components/properties/sections/SloppinessSection';
import type { StrokeUiStyle } from '../components/properties/sections/StrokeStyleSection';
import { entityStyleFromDefaults } from './style/entityStyleFromDefaults';
import { shouldIgnoreCanvasShortcuts } from '../lib/keyboard/canvasShortcuts';
import {
  createImageEntity,
} from '../lib/state/schema';
import {
  fitImageDisplaySize,
  loadImageDimensions,
  readFileAsDataUrl,
} from '../lib/import/imageImport';

export const CANVAS_BG_DARK = 0x0a0a0a;
export const CANVAS_BG_LIGHT = 0xffffff;

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ViewportController {
  zoomIn: () => void;
  zoomOut: () => void;
  centerOn: (x: number, y: number) => void;
  getVisibleBounds: () => Bounds;
  capturePng: () => Promise<Blob | null>;
}

export type DvDocumentSnapshot = DvWorldDocument;

interface EngineContextValue {
  store: StoreManager;
  camera: CameraState;
  setCamera: (camera: CameraState) => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  zoomPercent: number;
  zoomIn: () => void;
  zoomOut: () => void;
  centerOnPoint: (x: number, y: number) => void;
  subscribe: (listener: () => void) => () => void;
  registerViewport: (controller: ViewportController | null) => void;
  registerCanvasInput: (api: { setActiveTool: (tool: string) => void; refreshSelectionOverlay: () => void } | null) => void;
  getDocumentSnapshot: () => DvDocumentSnapshot;
  serializeCanvasState: () => string;
  loadWorldDocument: (document: DvWorldDocument) => void;
  getVisibleBounds: () => Bounds | null;
  capturePng: () => Promise<Blob | null>;
  history: StoreHistoryState;
  undo: () => boolean;
  redo: () => boolean;
  addEntity: (entity: BoardEntity, options?: { tracked?: boolean }) => void;
  updateEntity: (id: string, patch: BoardEntityPatch) => BoardEntity | null;
  deleteEntity: (id: string) => void;
  getEntity: (id: string) => BoardEntity | null;
  getAllEntities: () => BoardEntity[];
  beginGesture: (gestureId: string, entityIds?: string[]) => void;
  commitGesture: () => void;
  cancelGesture: () => void;
  registerGestureEntity: (entityId: string) => void;
  applyGesturePreview: (entityId: string, patch: BoardEntityPatch) => BoardEntity | null;
  appendFreehandPoints: (entityId: string, points: number[], patch?: BoardEntityPatch) => BoardEntity | null;
  clearCanvas: () => void;
  styleDefaults: CanvasStyleDefaults;
  setStrokeColor: (color: DvColorStyle) => void;
  setFillStyle: (fill: DvFillStyle) => void;
  setStrokeStyle: (stroke: StrokeUiStyle) => void;
  setStrokeWidth: (size: DvSizeStyle) => void;
  setSloppiness: (value: SloppinessUi) => void;
  setOpacity: (percent: number) => void;
  selectedIds: ReadonlySet<string>;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
  deleteSelection: () => void;
  applyStyleToSelection: () => void;
  selectionLabel: string;
  pendingLinkSource: PendingLinkSource | null;
  setPendingLinkSource: (source: PendingLinkSource | null) => void;
  completeSpatialLink: (targetShapeId: string) => void;
  getAllSpatialLinks: () => SpatialLink[];
  getContentBounds: () => Bounds | null;
  importDocumentFile: (file: File, worldX: number, worldY: number) => Promise<string>;
  importImageFile: (file: File, worldX: number, worldY: number) => Promise<string>;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  showGrid: boolean;
  setShowGrid: (value: boolean) => void;
  registerScene: (scene: { app: Application; viewport: Viewport } | null) => void;
  registerDocumentLayers: (
    layers: {
      documentOverlay?: { syncAll: () => void } | null;
      linksLayer?: { sync: () => void } | null;
    } | null,
  ) => void;
  refreshDocumentLayers: () => void;
  revision: number;
}

const EngineContext = createContext<EngineContextValue | null>(null);

const DEFAULT_CAMERA: CameraState = { x: 0, y: 0, zoom: 1 };

export function EngineProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StoreManager>(getStoreManager());
  const store = storeRef.current;

  const [camera, setCameraState] = useState<CameraState>(DEFAULT_CAMERA);
  const [activeTool, setActiveToolState] = useState<string>('select');
  const [styleDefaults, setStyleDefaults] = useState<CanvasStyleDefaults>(DEFAULT_CANVAS_STYLE);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [revision, setRevision] = useState(0);
  const [history, setHistory] = useState<StoreHistoryState>(store.getHistoryState());

  const viewportRef = useRef<ViewportController | null>(null);
  const canvasInputRef = useRef<{
    setActiveTool: (tool: string) => void;
    refreshSelectionOverlay: () => void;
  } | null>(null);
  const listenersRef = useRef(new Set<() => void>());
  const sceneRef = useRef<{ app: Application; viewport: Viewport } | null>(null);
  const documentLayersRef = useRef<{ syncAll: () => void } | null>(null);
  const linksLayerRef = useRef<{ sync: () => void } | null>(null);
  const [pendingLinkSource, setPendingLinkSourceState] = useState<PendingLinkSource | null>(null);
  const [isDarkMode, setIsDarkModeState] = useState(true);
  const [showGrid, setShowGridState] = useState(false);

  const notify = useCallback(() => {
    setRevision((r) => r + 1);
    listenersRef.current.forEach((fn) => fn());
  }, []);

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  useEffect(() => {
    const unsubStore = store.subscribe(() => notify());
    const unsubHistory = store.subscribeHistory(setHistory);
    return () => {
      unsubStore();
      unsubHistory();
    };
  }, [store, notify]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    notify();
  }, [isDarkMode, notify]);

  const setIsDarkMode = useCallback(
    (value: boolean) => {
      setIsDarkModeState(value);
      notify();
    },
    [notify],
  );

  const toggleDarkMode = useCallback(() => {
    setIsDarkModeState((v) => !v);
    notify();
  }, [notify]);

  const setShowGrid = useCallback(
    (value: boolean) => {
      setShowGridState(value);
      notify();
    },
    [notify],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreCanvasShortcuts(event)) return;

      if (event.metaKey || event.ctrlKey) {
        const key = event.key.toLowerCase();
        if (key === 'z' && !event.shiftKey) {
          event.preventDefault();
          store.undo();
        } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
          event.preventDefault();
          store.redo();
        }
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        const ids = [...selectedIds];
        if (ids.length === 0) return;
        for (const id of ids) store.deleteEntity(id);
        setSelectedIds(new Set());
        notify();
        canvasInputRef.current?.refreshSelectionOverlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [store, selectedIds, notify]);

  const registerViewport = useCallback(
    (controller: ViewportController | null) => {
      viewportRef.current = controller;
      notify();
    },
    [notify],
  );

  const registerCanvasInput = useCallback(
    (api: { setActiveTool: (tool: string) => void; refreshSelectionOverlay: () => void } | null) => {
      canvasInputRef.current = api;
    },
    [],
  );

  const setActiveTool = useCallback((tool: string) => {
    setActiveToolState(tool);
    canvasInputRef.current?.setActiveTool(tool);
    notify();
  }, [notify]);

  const setCamera = useCallback(
    (next: CameraState) => {
      setCameraState(next);
      notify();
    },
    [notify],
  );

  const zoomIn = useCallback(() => viewportRef.current?.zoomIn(), []);
  const zoomOut = useCallback(() => viewportRef.current?.zoomOut(), []);
  const centerOnPoint = useCallback((x: number, y: number) => {
    viewportRef.current?.centerOn(x, y);
  }, []);

  const getDocumentSnapshot = useCallback((): DvDocumentSnapshot => {
    return store.exportWorldDocument(camera);
  }, [store, camera]);

  const serializeCanvasState = useCallback((): string => {
    return store.serializeCanvasState(camera, { projectName: undefined });
  }, [store, camera]);

  const loadWorldDocument = useCallback(
    (document: DvWorldDocument) => {
      store.importWorldDocument(document, { tracked: false });
      setCameraState(document.camera);
      setSelectedIds(new Set());
      viewportRef.current?.centerOn(document.camera.x, document.camera.y);
      canvasInputRef.current?.setActiveTool('select');
      setActiveToolState('select');
      documentLayersRef.current?.syncAll();
      linksLayerRef.current?.sync();
      notify();
    },
    [store, notify],
  );

  const getVisibleBounds = useCallback(() => viewportRef.current?.getVisibleBounds() ?? null, []);

  const capturePng = useCallback(async () => {
    const scene = sceneRef.current;
    if (scene) {
      const entities = store.getAllEntities();
      return exportViewportToPng(scene.app, scene.viewport, entities);
    }
    return viewportRef.current?.capturePng() ?? null;
  }, [store]);

  const registerScene = useCallback((scene: { app: Application; viewport: Viewport } | null) => {
    sceneRef.current = scene;
  }, []);

  const registerDocumentLayers = useCallback(
    (
      layers: {
        documentOverlay?: { syncAll: () => void } | null;
        linksLayer?: { sync: () => void } | null;
      } | null,
    ) => {
      documentLayersRef.current = layers?.documentOverlay ?? null;
      linksLayerRef.current = layers?.linksLayer ?? null;
    },
    [],
  );

  const refreshDocumentLayers = useCallback(() => {
    documentLayersRef.current?.syncAll();
    linksLayerRef.current?.sync();
  }, []);

  const getContentBounds = useCallback(() => computeEntitiesBounds(store.getAllEntities()), [store]);

  const getAllSpatialLinks = useCallback(() => store.getAllSpatialLinks(), [store]);

  const setPendingLinkSource = useCallback((source: PendingLinkSource | null) => {
    setPendingLinkSourceState(source);
    if (source) setActiveToolState('link');
    notify();
  }, [notify]);

  const completeSpatialLink = useCallback(
    (targetShapeId: string) => {
      if (!pendingLinkSource) return;
      const link = createSpatialLink({
        sourceDocumentId: pendingLinkSource.documentId,
        charRange: pendingLinkSource.charRange,
        targetShapeId,
        label: pendingLinkSource.excerpt.slice(0, 80),
      });
      store.addSpatialLink(link);
      setPendingLinkSourceState(null);
      setActiveToolState('select');
      canvasInputRef.current?.setActiveTool('select');
      linksLayerRef.current?.sync();
      notify();
    },
    [pendingLinkSource, store, notify],
  );


  const undo = useCallback(() => store.undo(), [store]);
  const redo = useCallback(() => store.redo(), [store]);

  const addEntity = useCallback(
    (entity: BoardEntity, options?: { tracked?: boolean }) => {
      store.addEntity(entity, options);
    },
    [store],
  );

  const updateEntity = useCallback(
    (id: string, patch: BoardEntityPatch) => store.updateEntity(id, patch),
    [store],
  );

  const deleteEntity = useCallback((id: string) => store.deleteEntity(id), [store]);

  const getEntity = useCallback((id: string) => store.getEntity(id), [store]);

  const getAllEntities = useCallback(() => store.getAllEntities(), [store]);

  const beginGesture = useCallback(
    (gestureId: string, entityIds?: string[]) => store.beginGesture(gestureId, entityIds),
    [store],
  );

  const commitGesture = useCallback(() => store.commitGesture(), [store]);
  const cancelGesture = useCallback(() => store.cancelGesture(), [store]);
  const registerGestureEntity = useCallback((id: string) => store.registerGestureEntity(id), [store]);

  const applyGesturePreview = useCallback(
    (entityId: string, patch: BoardEntityPatch) => store.applyGesturePreview(entityId, patch),
    [store],
  );

  const appendFreehandPoints = useCallback(
    (entityId: string, points: number[], patch?: BoardEntityPatch) =>
      store.appendFreehandPoints(entityId, points, patch),
    [store],
  );

  const clearCanvas = useCallback(() => {
    store.clearEntities();
    setSelectedIds(new Set());
    notify();
  }, [store, notify]);

  const setSelection = useCallback(
    (ids: string[]) => {
      setSelectedIds(new Set(ids));
      notify();
      canvasInputRef.current?.refreshSelectionOverlay();
    },
    [notify],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    notify();
    canvasInputRef.current?.refreshSelectionOverlay();
  }, [notify]);

  const importDocumentFile = useCallback(
    async (file: File, worldX: number, worldY: number) => {
      const entity = await buildDocumentEntityFromFile(file, worldX, worldY);
      store.addEntity(entity);
      setSelectedIds(new Set([entity.id]));
      notify();
      documentLayersRef.current?.syncAll();
      return entity.id;
    },
    [store, notify],
  );

  const importImageFile = useCallback(
    async (file: File, worldX: number, worldY: number) => {
      if (!file.type.startsWith('image/')) {
        throw new Error('Not an image file');
      }
      const src = await readFileAsDataUrl(file);
      const natural = await loadImageDimensions(src);
      const { width, height } = fitImageDisplaySize(natural.width, natural.height);
      const entity = createImageEntity({
        x: worldX - width / 2,
        y: worldY - height / 2,
        width,
        height,
        src,
        naturalWidth: natural.width,
        naturalHeight: natural.height,
        fileName: file.name,
        style: entityStyleFromDefaults(styleDefaults),
      });
      store.addEntity(entity);
      setSelectedIds(new Set([entity.id]));
      notify();
      return entity.id;
    },
    [store, styleDefaults, notify],
  );

  const deleteSelection = useCallback(() => {
    for (const id of selectedIds) store.deleteEntity(id);
    setSelectedIds(new Set());
    notify();
  }, [store, selectedIds, notify]);

  const applyStyleToSelection = useCallback(() => {
    const style = entityStyleFromDefaults(styleDefaults);
    for (const id of selectedIds) {
      store.updateEntity(id, { style });
    }
    notify();
  }, [store, selectedIds, styleDefaults, notify]);

  const setStrokeColor = useCallback((color: DvColorStyle) => {
    setStyleDefaults((s) => ({ ...s, strokeColor: color }));
    notify();
  }, [notify]);

  const setFillStyle = useCallback((fill: DvFillStyle) => {
    setStyleDefaults((s) => ({ ...s, fillStyle: fill }));
    notify();
  }, [notify]);

  const setStrokeStyle = useCallback((stroke: StrokeUiStyle) => {
    setStyleDefaults((s) => ({ ...s, strokeStyle: stroke }));
    notify();
  }, [notify]);

  const setStrokeWidth = useCallback((size: DvSizeStyle) => {
    setStyleDefaults((s) => ({ ...s, strokeWidth: size }));
    notify();
  }, [notify]);

  const setSloppiness = useCallback((value: SloppinessUi) => {
    setStyleDefaults((s) => ({ ...s, sloppiness: value }));
    notify();
  }, [notify]);

  const setOpacity = useCallback((percent: number) => {
    setStyleDefaults((s) => ({ ...s, opacity: percent }));
    notify();
  }, [notify]);

  const selectionLabel = useMemo(() => {
    if (selectedIds.size === 0) return 'No Selection';
    if (selectedIds.size === 1) return [...selectedIds][0]!.slice(0, 8);
    return `${selectedIds.size} selected`;
  }, [selectedIds]);

  const value = useMemo<EngineContextValue>(
    () => ({
      store,
      camera,
      setCamera,
      activeTool,
      setActiveTool,
      zoomPercent: Math.round(camera.zoom * 100),
      zoomIn,
      zoomOut,
      centerOnPoint,
      subscribe,
      registerViewport,
      registerCanvasInput,
      getDocumentSnapshot,
      serializeCanvasState,
      loadWorldDocument,
      getVisibleBounds,
      capturePng,
      history,
      undo,
      redo,
      addEntity,
      updateEntity,
      deleteEntity,
      getEntity,
      getAllEntities,
      beginGesture,
      commitGesture,
      cancelGesture,
      registerGestureEntity,
      applyGesturePreview,
      appendFreehandPoints,
      clearCanvas,
      styleDefaults,
      setStrokeColor,
      setFillStyle,
      setStrokeStyle,
      setStrokeWidth,
      setSloppiness,
      setOpacity,
      selectedIds,
      setSelection,
      clearSelection,
      deleteSelection,
      applyStyleToSelection,
      selectionLabel,
      pendingLinkSource,
      setPendingLinkSource,
      completeSpatialLink,
      getAllSpatialLinks,
      getContentBounds,
      importDocumentFile,
      importImageFile,
      isDarkMode,
      setIsDarkMode,
      toggleDarkMode,
      showGrid,
      setShowGrid,
      registerScene,
      registerDocumentLayers,
      refreshDocumentLayers,
      revision,
    }),
    [
      store,
      camera,
      setCamera,
      activeTool,
      setActiveTool,
      zoomIn,
      zoomOut,
      centerOnPoint,
      subscribe,
      registerViewport,
      registerCanvasInput,
      getDocumentSnapshot,
      serializeCanvasState,
      loadWorldDocument,
      getVisibleBounds,
      capturePng,
      history,
      undo,
      redo,
      addEntity,
      updateEntity,
      deleteEntity,
      getEntity,
      getAllEntities,
      beginGesture,
      commitGesture,
      cancelGesture,
      registerGestureEntity,
      applyGesturePreview,
      appendFreehandPoints,
      clearCanvas,
      styleDefaults,
      setStrokeColor,
      setFillStyle,
      setStrokeStyle,
      setStrokeWidth,
      setSloppiness,
      setOpacity,
      selectedIds,
      setSelection,
      clearSelection,
      deleteSelection,
      applyStyleToSelection,
      selectionLabel,
      pendingLinkSource,
      setPendingLinkSource,
      completeSpatialLink,
      getAllSpatialLinks,
      getContentBounds,
      importDocumentFile,
      importImageFile,
      isDarkMode,
      setIsDarkMode,
      toggleDarkMode,
      showGrid,
      setShowGrid,
      registerScene,
      refreshDocumentLayers,
      revision,
    ],
  );

  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

export function useEngine() {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error('useEngine must be used within EngineProvider');
  return ctx;
}

export function useEngineRevision(onRevision: () => void) {
  const engine = useEngine();
  useEffect(() => engine.subscribe(onRevision), [engine, onRevision]);
}

export { DOCUMENT_SCHEMA_VERSION };

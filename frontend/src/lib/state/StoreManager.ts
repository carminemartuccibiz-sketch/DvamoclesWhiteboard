import * as Y from 'yjs';
import { UndoManager } from 'yjs';
import {
  applyPatchToYMap,
  entityFromYValue,
  entityToYValue,
  ensureYEntityMap,
  mergePatchInStore,
  readEntityFromStore,
  spatialLinkFromYValue,
  spatialLinkToYValue,
} from './entityCodec';
import {
  cloneEntity,
  DOCUMENT_SCHEMA_VERSION,
  type BoardEntity,
  type BoardEntityPatch,
  type DvWorldDocument,
  type SpatialLink,
} from './schema';

/** Tracked by UndoManager — each call becomes one undo/redo step */
export const ORIGIN_UNDO_TRACKED = 'dv-undo-tracked';

/** Live gesture updates — excluded from undo stack until commitGesture() */
export const ORIGIN_GESTURE_LIVE = 'dv-gesture-live';

export type StoreChangeKind =
  | 'add'
  | 'update'
  | 'delete'
  | 'clear'
  | 'reset'
  | 'preview'
  | 'preview-clear'
  | 'links-changed';

export interface StoreChangeEvent {
  kind: StoreChangeKind;
  entityId: string;
  entity: BoardEntity | null;
  /** Merged preview overlay when kind is `preview` */
  preview?: BoardEntity | null;
}

export type StoreListener = (event: StoreChangeEvent) => void;

export interface StoreHistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoStackLength: number;
  redoStackLength: number;
}

export interface GestureSession {
  readonly id: string;
}

interface GestureBaseline {
  entities: Map<string, BoardEntity>;
}

/**
 * Authoritative Yjs world store for canvas entities.
 * React and Pixi subscribe via `subscribe()` — never poll Y.Map per frame from React.
 */
export class StoreManager {
  readonly doc: Y.Doc;

  /** Shared map: entity id → entity payload (plain object or nested Y.Map) */
  readonly entities: Y.Map<unknown>;

  /** Spatial text↔shape links */
  readonly spatialLinks: Y.Map<unknown>;

  readonly undoManager: UndoManager;

  private readonly listeners = new Set<StoreListener>();
  private readonly previewEntities = new Map<string, BoardEntity>();
  private gestureSession: GestureSession | null = null;
  private gestureEntityIds = new Set<string>();
  private gestureBaseline: GestureBaseline | null = null;
  private historyListeners = new Set<(state: StoreHistoryState) => void>();

  constructor(doc?: Y.Doc) {
    this.doc = doc ?? new Y.Doc();
    this.entities = this.doc.getMap('entities');
    this.spatialLinks = this.doc.getMap('spatialLinks');

    this.undoManager = new UndoManager([this.entities, this.spatialLinks], {
      trackedOrigins: new Set([ORIGIN_UNDO_TRACKED, null]),
      captureTimeout: 0,
    });

    this.entities.observeDeep(this.handleYDeepChange);
    this.spatialLinks.observe(this.handleLinksChange);
    this.undoManager.on('stack-item-added', this.emitHistory);
    this.undoManager.on('stack-item-popped', this.emitHistory);
    this.undoManager.on('stack-cleared', this.emitHistory);
  }

  // ——— Subscription ———

  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeHistory(listener: (state: StoreHistoryState) => void): () => void {
    this.historyListeners.add(listener);
    listener(this.getHistoryState());
    return () => this.historyListeners.delete(listener);
  }

  getHistoryState(): StoreHistoryState {
    return {
      canUndo: this.undoManager.undoStack.length > 0,
      canRedo: this.undoManager.redoStack.length > 0,
      undoStackLength: this.undoManager.undoStack.length,
      redoStackLength: this.undoManager.redoStack.length,
    };
  }

  // ——— Read API ———

  getEntity(id: string): BoardEntity | null {
    const preview = this.previewEntities.get(id);
    if (preview) return cloneEntity(preview);
    return readEntityFromStore(this.entities, id);
  }

  getEntityForRender(id: string): BoardEntity | null {
    return this.getEntity(id);
  }

  getAllEntities(): BoardEntity[] {
    const ids = new Set<string>();
    this.entities.forEach((_v, key) => ids.add(key));
    this.previewEntities.forEach((_v, key) => ids.add(key));
    const list: BoardEntity[] = [];
    for (const id of ids) {
      const entity = this.getEntity(id);
      if (entity) list.push(entity);
    }
    return list;
  }

  getEntityCount(): number {
    return this.getAllEntities().length;
  }

  getSpatialLink(id: string): SpatialLink | null {
    return spatialLinkFromYValue(this.spatialLinks.get(id));
  }

  getAllSpatialLinks(): SpatialLink[] {
    const links: SpatialLink[] = [];
    this.spatialLinks.forEach((value) => {
      const link = spatialLinkFromYValue(value);
      if (link) links.push(link);
    });
    return links;
  }

  addSpatialLink(link: SpatialLink, options?: { tracked?: boolean }): void {
    const tracked = options?.tracked !== false;
    this.runTransaction(() => {
      this.spatialLinks.set(link.id, spatialLinkToYValue(link));
    }, tracked ? ORIGIN_UNDO_TRACKED : ORIGIN_GESTURE_LIVE);
    this.emitLinksChanged();
  }

  deleteSpatialLink(id: string, options?: { tracked?: boolean }): void {
    const tracked = options?.tracked !== false;
    this.runTransaction(() => {
      this.spatialLinks.delete(id);
    }, tracked ? ORIGIN_UNDO_TRACKED : ORIGIN_GESTURE_LIVE);
    this.emitLinksChanged();
  }

  clearSpatialLinks(options?: { tracked?: boolean }): void {
    const tracked = options?.tracked !== false;
    this.runTransaction(() => {
      this.spatialLinks.clear();
    }, tracked ? ORIGIN_UNDO_TRACKED : ORIGIN_GESTURE_LIVE);
    this.emitLinksChanged();
  }

  hasEntity(id: string): boolean {
    return this.previewEntities.has(id) || this.entities.has(id);
  }

  // ——— Synchronous CRUD (tracked undo by default) ———

  addEntity(entity: BoardEntity, options?: { tracked?: boolean }): void {
    const tracked = options?.tracked !== false;
    this.runTransaction(
      () => {
        this.entities.set(entity.id, entityToYValue(entity));
      },
      tracked ? ORIGIN_UNDO_TRACKED : ORIGIN_GESTURE_LIVE,
    );
    this.emit({
      kind: 'add',
      entityId: entity.id,
      entity: cloneEntity(entity),
    });
  }

  updateEntity(id: string, patch: BoardEntityPatch, options?: { tracked?: boolean }): BoardEntity | null {
    const tracked = options?.tracked !== false;
    let updated: BoardEntity | null = null;

    this.runTransaction(
      () => {
        updated = mergePatchInStore(this.entities, id, patch);
      },
      tracked ? ORIGIN_UNDO_TRACKED : ORIGIN_GESTURE_LIVE,
    );

    if (!updated) return null;

    this.emit({
      kind: 'update',
      entityId: id,
      entity: updated,
    });
    return updated;
  }

  deleteEntity(id: string, options?: { tracked?: boolean }): void {
    const tracked = options?.tracked !== false;
    if (!this.entities.has(id) && !this.previewEntities.has(id)) return;

    this.previewEntities.delete(id);

    this.runTransaction(
      () => {
        this.entities.delete(id);
      },
      tracked ? ORIGIN_UNDO_TRACKED : ORIGIN_GESTURE_LIVE,
    );

    this.emit({
      kind: 'delete',
      entityId: id,
      entity: null,
    });
  }

  replaceAllEntities(entities: Record<string, BoardEntity>, options?: { tracked?: boolean }): void {
    const tracked = options?.tracked !== false;
    this.previewEntities.clear();

    this.runTransaction(
      () => {
        this.entities.clear();
        for (const entity of Object.values(entities)) {
          this.entities.set(entity.id, entityToYValue(cloneEntity(entity)));
        }
      },
      tracked ? ORIGIN_UNDO_TRACKED : ORIGIN_GESTURE_LIVE,
    );

    this.emit({
      kind: 'reset',
      entityId: '*',
      entity: null,
    });
  }

  clearEntities(options?: { tracked?: boolean }): void {
    const tracked = options?.tracked !== false;
    this.previewEntities.clear();

    this.runTransaction(
      () => {
        this.entities.clear();
        this.spatialLinks.clear();
      },
      tracked ? ORIGIN_UNDO_TRACKED : ORIGIN_GESTURE_LIVE,
    );

    this.emit({ kind: 'clear', entityId: '*', entity: null });
    this.emitLinksChanged();
  }

  // ——— Gesture grouping (drag, freehand stroke, etc.) ———

  /**
   * Begin a coalesced gesture. Live updates use untracked origin; call `commitGesture()` once.
   * @param entityIds Entities touched by this gesture (snapshots taken for undo).
   */
  beginGesture(gestureId: string, entityIds: string[] = []): GestureSession {
    if (this.gestureSession) {
      this.cancelGesture();
    }

    const baseline = new Map<string, BoardEntity>();
    for (const id of entityIds) {
      const current = readEntityFromStore(this.entities, id);
      if (current) baseline.set(id, cloneEntity(current));
    }

    this.gestureBaseline = { entities: baseline };
    this.gestureEntityIds = new Set(entityIds);
    this.gestureSession = { id: gestureId };

    this.undoManager.stopCapturing();
    return this.gestureSession;
  }

  /**
   * Register an entity created mid-gesture (e.g. freehand stroke started on pointer down).
   * Baseline records `null` meaning delete on undo revert.
   */
  registerGestureEntity(entityId: string): void {
    if (!this.gestureSession) return;
    this.gestureEntityIds.add(entityId);
    if (!this.gestureBaseline) this.gestureBaseline = { entities: new Map() };
    if (!this.gestureBaseline.entities.has(entityId)) {
      const current = readEntityFromStore(this.entities, entityId);
      if (current) {
        this.gestureBaseline.entities.set(entityId, cloneEntity(current));
      }
    }
  }

  /**
   * Apply a live update during an active gesture (not an undo step).
   * Pixi receives `preview` events immediately.
   */
  applyGesturePreview(entityId: string, patch: BoardEntityPatch): BoardEntity | null {
    const base =
      this.previewEntities.get(entityId) ??
      readEntityFromStore(this.entities, entityId);

    if (!base) return null;

    const merged = {
      ...cloneEntity(base),
      ...patch,
      style: {
        ...base.style,
        ...patch.style,
      },
    } as BoardEntity;

    if (base.type === 'freehand' && patch.points) {
      (merged as BoardEntity & { points: number[] }).points = [...patch.points];
    }

    this.previewEntities.set(entityId, merged);

    this.runTransaction(
      () => {
        const yEntity = ensureYEntityMap(this.entities, entityId, () => merged);
        applyPatchToYMap(yEntity, patch);
      },
      ORIGIN_GESTURE_LIVE,
    );

    this.emit({
      kind: 'preview',
      entityId,
      entity: merged,
      preview: merged,
    });

    return merged;
  }

  /**
   * Push live freehand points during draw without closing the gesture.
   */
  appendFreehandPoints(entityId: string, points: number[], patch?: BoardEntityPatch): BoardEntity | null {
    const current = this.getEntity(entityId);
    if (!current || current.type !== 'freehand') return null;
    const nextPoints = [...current.points, ...points];
    return this.applyGesturePreview(entityId, {
      ...patch,
      points: nextPoints,
    });
  }

  /**
   * Finalize gesture: one undo/redo step from baseline → current document state.
   */
  commitGesture(): void {
    if (!this.gestureSession || !this.gestureBaseline) {
      this.discardGestureState();
      return;
    }

    const baseline = this.gestureBaseline;
    const touchedIds = [...this.gestureEntityIds];

    this.runTransaction(() => {
      for (const id of touchedIds) {
        const before = baseline.entities.get(id);
        const after = readEntityFromStore(this.entities, id);

        if (!after) {
          if (before) this.entities.delete(id);
          continue;
        }

        if (!before) {
          this.entities.delete(id);
          this.entities.set(id, entityToYValue(after));
          continue;
        }

        this.entities.set(id, entityToYValue(before));
        this.entities.set(id, entityToYValue(after));
      }
    }, ORIGIN_UNDO_TRACKED);

    this.discardGestureState();

    for (const id of touchedIds) {
      const entity = readEntityFromStore(this.entities, id);
      this.emit({
        kind: entity ? 'update' : 'delete',
        entityId: id,
        entity,
      });
    }

    this.undoManager.stopCapturing();
    this.emitHistory();
  }

  cancelGesture(): void {
    if (!this.gestureSession || !this.gestureBaseline) {
      this.discardGestureState();
      return;
    }

    const baseline = this.gestureBaseline;

    this.runTransaction(() => {
      for (const id of this.gestureEntityIds) {
        const before = baseline.entities.get(id);
        if (before) {
          this.entities.set(id, entityToYValue(before));
        } else {
          this.entities.delete(id);
        }
      }
    }, ORIGIN_GESTURE_LIVE);

    this.discardGestureState();
    this.emit({ kind: 'preview-clear', entityId: '*', entity: null });
    this.emit({ kind: 'reset', entityId: '*', entity: null });
  }

  // ——— Undo / Redo ———

  undo(): boolean {
    if (this.undoManager.undoStack.length === 0) return false;
    this.discardGestureState();
    this.undoManager.undo();
    this.emit({ kind: 'reset', entityId: '*', entity: null });
    this.emitHistory();
    return true;
  }

  redo(): boolean {
    if (this.undoManager.redoStack.length === 0) return false;
    this.discardGestureState();
    this.undoManager.redo();
    this.emit({ kind: 'reset', entityId: '*', entity: null });
    this.emitHistory();
    return true;
  }

  // ——— Persistence ———

  /** JSON string of the universal world document (entities map + spatial links + camera). */
  serializeCanvasState(
    camera: DvWorldDocument['camera'],
    meta?: Partial<DvWorldDocument['meta']>,
  ): string {
    return JSON.stringify(this.exportWorldDocument(camera, meta));
  }

  exportWorldDocument(camera: DvWorldDocument['camera'], meta?: Partial<DvWorldDocument['meta']>): DvWorldDocument {
    const entities: Record<string, BoardEntity> = {};
    this.entities.forEach((value, key) => {
      const entity = entityFromYValue(value);
      if (entity) entities[key] = entity;
    });

    return {
      schemaVersion: DOCUMENT_SCHEMA_VERSION,
      camera,
      entities,
      spatialLinks: this.getAllSpatialLinks(),
      meta: {
        savedAt: new Date().toISOString(),
        ...meta,
      },
    };
  }

  importWorldDocument(document: DvWorldDocument, options?: { tracked?: boolean }): void {
    const tracked = options?.tracked !== false;
    this.replaceAllEntities(document.entities, { tracked });
    this.runTransaction(() => {
      this.spatialLinks.clear();
      for (const link of document.spatialLinks ?? []) {
        this.spatialLinks.set(link.id, spatialLinkToYValue(link));
      }
    }, tracked ? ORIGIN_UNDO_TRACKED : ORIGIN_GESTURE_LIVE);
    this.emitLinksChanged();
  }

  /** Lossless binary update for future sync providers */
  encodeState(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  applyEncodedState(update: Uint8Array): void {
    Y.applyUpdate(this.doc, update);
    this.emit({ kind: 'reset', entityId: '*', entity: null });
  }

  private handleLinksChange = () => {
    this.emitLinksChanged();
  };

  private emitLinksChanged(): void {
    this.emit({ kind: 'links-changed', entityId: '*', entity: null });
  }

  destroy(): void {
    this.entities.unobserveDeep(this.handleYDeepChange);
    this.spatialLinks.unobserve(this.handleLinksChange);
    this.listeners.clear();
    this.historyListeners.clear();
    this.previewEntities.clear();
    this.doc.destroy();
  }

  // ——— Internals ———

  private runTransaction(fn: () => void, origin: string): void {
    this.doc.transact(fn, origin);
  }

  private discardGestureState(): void {
    this.previewEntities.clear();
    this.gestureSession = null;
    this.gestureEntityIds.clear();
    this.gestureBaseline = null;
  }

  private handleYDeepChange = (events: Y.YEvent<Y.AbstractType<unknown>>[], transaction: Y.Transaction) => {
    if (transaction.origin === ORIGIN_GESTURE_LIVE) {
      return;
    }

    const origin = transaction.origin;
    const isTracked = origin === ORIGIN_UNDO_TRACKED || origin === null;

    if (!isTracked && origin !== undefined) return;

    for (const event of events) {
      if (!(event.target instanceof Y.Map) || event.target !== this.entities) continue;

      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add' || change.action === 'update') {
          const entity = readEntityFromStore(this.entities, key);
          this.emit({
            kind: change.action === 'add' ? 'add' : 'update',
            entityId: key,
            entity,
          });
        } else if (change.action === 'delete') {
          this.emit({ kind: 'delete', entityId: key, entity: null });
        }
      });
    }
  };

  private emit(event: StoreChangeEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private emitHistory = (): void => {
    const state = this.getHistoryState();
    for (const listener of this.historyListeners) {
      listener(state);
    }
  };
}

/** Process-wide default store (replaced when loading a project in later phases) */
let defaultStore: StoreManager | null = null;

export function getStoreManager(): StoreManager {
  if (!defaultStore) {
    defaultStore = new StoreManager();
  }
  return defaultStore;
}

export function resetStoreManager(store?: StoreManager): StoreManager {
  defaultStore?.destroy();
  defaultStore = store ?? new StoreManager();
  return defaultStore;
}

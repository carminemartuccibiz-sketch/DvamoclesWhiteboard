import type { Viewport } from 'pixi-viewport';
import type { BoardEntity } from '../../lib/state/schema';
import { getEntityAabb, type WorldBounds } from '../../lib/spatial/entityBounds';
import { SpatialHashGrid } from '../../lib/spatial/SpatialHashGrid';
import { resolveLodState, type LodState } from './lodPolicy';

export type ViewportRect = WorldBounds;

export interface ViewportCullContext {
  viewport: ViewportRect;
  lod: LodState;
  visibleIds: ReadonlySet<string>;
}

export type ViewportCullListener = (ctx: ViewportCullContext) => void;

/** World-space margin beyond the visible rect — reduces pop-in while panning */
const BASE_CULL_PADDING = 160;

/**
 * Central render pipeline: spatial hash queries + LOD + rAF-coalesced viewport updates.
 * Layers subscribe to visibility/LOD changes instead of scanning all entities each frame.
 */
export class RenderManager {
  private readonly grid = new SpatialHashGrid<string>(512);
  private readonly entityById = new Map<string, BoardEntity>();
  private readonly listeners = new Set<ViewportCullListener>();

  private viewport: Viewport | null = null;
  private onViewportChange: (() => void) | null = null;
  private rafId = 0;

  private viewportRect: ViewportRect = {
    minX: -1_000_000,
    minY: -1_000_000,
    maxX: 1_000_000,
    maxY: 1_000_000,
  };
  private lod: LodState = resolveLodState(1);
  private visibleIds = new Set<string>();

  attachViewport(viewport: Viewport): void {
    this.detachViewport();
    this.viewport = viewport;
    this.onViewportChange = () => this.scheduleViewportFlush();
    viewport.on('moved', this.onViewportChange);
    viewport.on('zoomed', this.onViewportChange);
    this.scheduleViewportFlush();
  }

  detachViewport(): void {
    if (this.viewport && this.onViewportChange) {
      this.viewport.off('moved', this.onViewportChange);
      this.viewport.off('zoomed', this.onViewportChange);
    }
    this.viewport = null;
    this.onViewportChange = null;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  subscribe(listener: ViewportCullListener): () => void {
    this.listeners.add(listener);
    listener({
      viewport: this.viewportRect,
      lod: this.lod,
      visibleIds: this.visibleIds,
    });
    return () => this.listeners.delete(listener);
  }

  rebuildIndex(entities: BoardEntity[]): void {
    this.grid.clear();
    this.entityById.clear();
    for (const entity of entities) {
      this.entityById.set(entity.id, entity);
      this.grid.insert(entity.id, getEntityAabb(entity));
    }
    this.scheduleViewportFlush();
  }

  upsertEntity(entity: BoardEntity): void {
    this.entityById.set(entity.id, entity);
    this.grid.update(entity.id, getEntityAabb(entity));
    this.scheduleViewportFlush();
  }

  removeEntity(id: string): void {
    this.entityById.delete(id);
    this.grid.remove(id);
    this.visibleIds.delete(id);
    this.scheduleViewportFlush();
  }

  getEntity(id: string): BoardEntity | undefined {
    return this.entityById.get(id);
  }

  getLod(): LodState {
    return this.lod;
  }

  getViewportRect(): ViewportRect {
    return this.viewportRect;
  }

  getVisibleIds(): ReadonlySet<string> {
    return this.visibleIds;
  }

  queryRect(rect: ViewportRect): string[] {
    return this.grid.query(rect);
  }

  isEntityVisible(id: string, selectedIds?: ReadonlySet<string>): boolean {
    if (selectedIds?.has(id)) return true;
    return this.visibleIds.has(id);
  }

  scheduleViewportFlush(): void {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.flushViewport();
    });
  }

  flushViewport(): void {
    if (!this.viewport) return;

    const bounds = this.viewport.getVisibleBounds();
    const scale = this.viewport.scale.x;
    const pad = BASE_CULL_PADDING / Math.max(scale, 0.08);

    this.viewportRect = {
      minX: bounds.left - pad,
      minY: bounds.top - pad,
      maxX: bounds.right + pad,
      maxY: bounds.bottom + pad,
    };

    this.lod = resolveLodState(scale);
    this.visibleIds = new Set(this.grid.query(this.viewportRect));

    const ctx: ViewportCullContext = {
      viewport: this.viewportRect,
      lod: this.lod,
      visibleIds: this.visibleIds,
    };

    for (const listener of this.listeners) {
      listener(ctx);
    }
  }

  destroy(): void {
    this.detachViewport();
    this.listeners.clear();
    this.grid.clear();
    this.entityById.clear();
    this.visibleIds.clear();
  }
}

export function createRenderManager(): RenderManager {
  return new RenderManager();
}

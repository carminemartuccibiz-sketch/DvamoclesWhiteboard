import { Container, Graphics } from 'pixi.js';
import type { Viewport } from 'pixi-viewport';
import type { StoreManager, StoreChangeEvent } from '../../lib/state/StoreManager';
import type { BoardEntity } from '../../lib/state/schema';
import type { RenderManager } from './RenderManager';
import type { LodState } from './lodPolicy';
import { drawPatternFill, drawSelectionOutline, renderEntityGraphics } from './entityDraw';
import { mountImageSprites } from './imageSprites';

export interface EntityLayerOptions {
  getSelectedIds: () => ReadonlySet<string>;
  renderManager: RenderManager;
}

export interface EntityLayerHandle {
  syncAll: () => void;
  destroy: () => void;
}

export function mountEntityLayer(
  viewport: Viewport,
  store: StoreManager,
  options: EntityLayerOptions,
): EntityLayerHandle {
  const { renderManager } = options;

  const worldLayer = new Container();
  worldLayer.label = 'entities';
  viewport.addChild(worldLayer);

  const selectionLayer = new Container();
  selectionLayer.label = 'selection';
  viewport.addChild(selectionLayer);

  const imageSprites = mountImageSprites(viewport);

  const graphicsById = new Map<string, Graphics>();
  const patternById = new Map<string, Graphics>();
  const selectionById = new Map<string, Graphics>();

  let currentLod: LodState = renderManager.getLod();
  let visibleIds = renderManager.getVisibleIds();

  const isShown = (id: string): boolean =>
    renderManager.isEntityVisible(id, options.getSelectedIds());

  const setNodeVisible = (id: string, visible: boolean) => {
    graphicsById.get(id) && (graphicsById.get(id)!.visible = visible);
    patternById.get(id) && (patternById.get(id)!.visible = visible);
    const sel = selectionById.get(id);
    if (sel) sel.visible = visible && currentLod.showSelectionChrome;
  };

  const ensureGraphics = (id: string): Graphics => {
    let g = graphicsById.get(id);
    if (!g) {
      g = new Graphics();
      g.eventMode = 'none';
      graphicsById.set(id, g);
      worldLayer.addChild(g);
    }
    return g;
  };

  const ensurePattern = (id: string): Graphics => {
    let p = patternById.get(id);
    if (!p) {
      p = new Graphics();
      patternById.set(id, p);
      worldLayer.addChild(p);
    }
    return p;
  };

  const ensureSelection = (id: string): Graphics => {
    let s = selectionById.get(id);
    if (!s) {
      s = new Graphics();
      selectionById.set(id, s);
      selectionLayer.addChild(s);
    }
    return s;
  };

  const removeGraphics = (id: string) => {
    imageSprites.removeEntity(id);
    for (const map of [graphicsById, patternById, selectionById]) {
      const node = map.get(id);
      if (!node) continue;
      node.parent?.removeChild(node);
      node.destroy();
      map.delete(id);
    }
  };

  const removeEntity = (id: string) => {
    removeGraphics(id);
    renderManager.removeEntity(id);
  };

  const paint = (entity: BoardEntity) => {
    const selected = options.getSelectedIds().has(entity.id);
    const forceGeometric = currentLod.simplifyStrokes;
    const show = isShown(entity.id);

    if (entity.type === 'document') {
      imageSprites.removeEntity(entity.id);
      const g = graphicsById.get(entity.id);
      if (g) g.clear();
      if (selected && currentLod.showSelectionChrome) {
        drawSelectionOutline(ensureSelection(entity.id), entity);
        setNodeVisible(entity.id, show);
      } else {
        selectionById.get(entity.id)?.clear();
        setNodeVisible(entity.id, show);
      }
      return;
    }

    if (entity.type === 'image') {
      const g = graphicsById.get(entity.id);
      if (g) g.clear();
      patternById.get(entity.id)?.clear();
      selectionById.get(entity.id)?.clear();
      imageSprites.syncEntity(entity, selected && currentLod.showSelectionChrome, show);
      return;
    }

    if (!show) {
      setNodeVisible(entity.id, false);
      return;
    }

    const g = ensureGraphics(entity.id);
    renderEntityGraphics(g, entity, { forceGeometric });

    const pattern = patternById.get(entity.id);
    if (entity.style.fillMode === 'pattern') {
      const pg = ensurePattern(entity.id);
      pg.clear();
      drawPatternFill(pg, entity);
    } else if (pattern) {
      pattern.clear();
    }

    const selGfx = selectionById.get(entity.id);
    if (selected && currentLod.showSelectionChrome) {
      drawSelectionOutline(ensureSelection(entity.id), entity);
    } else if (selGfx) {
      selGfx.clear();
    }

    setNodeVisible(entity.id, true);
  };

  const applyCullPass = () => {
    const selected = options.getSelectedIds();
    visibleIds = renderManager.getVisibleIds();
    currentLod = renderManager.getLod();

    selectionLayer.visible = currentLod.showSelectionChrome;

    for (const entity of store.getAllEntities()) {
      if (entity.type === 'document') continue;
      const show = renderManager.isEntityVisible(entity.id, selected);
      if (entity.type === 'image') {
        paint(entity);
        continue;
      }
      if (show && !graphicsById.has(entity.id)) {
        paint(entity);
      } else {
        setNodeVisible(entity.id, show);
      }
    }

    for (const id of selectionById.keys()) {
      if (!selected.has(id) || !currentLod.showSelectionChrome) {
        selectionById.get(id)?.clear();
      }
    }

    if (currentLod.showSelectionChrome) {
      for (const entity of store.getAllEntities()) {
        if (selected.has(entity.id)) paint(entity);
      }
    }
  };

  const syncAll = () => {
    const liveIds = new Set(store.getAllEntities().map((e) => e.id));
    for (const id of [...graphicsById.keys(), ...patternById.keys(), ...selectionById.keys()]) {
      if (!liveIds.has(id)) removeGraphics(id);
    }

    renderManager.rebuildIndex(store.getAllEntities());
    applyCullPass();
  };

  const onStoreChange = (event: StoreChangeEvent) => {
    if (event.kind === 'reset' || event.kind === 'clear' || event.kind === 'preview-clear') {
      syncAll();
      return;
    }

    if (event.kind === 'delete') {
      if (event.entityId === '*') {
        syncAll();
        return;
      }
      removeEntity(event.entityId);
      return;
    }

    const entity =
      event.entity ??
      (event.entityId !== '*' ? store.getEntityForRender(event.entityId) : null);

    if (entity) {
      renderManager.upsertEntity(entity);
      paint(entity);
    } else if (event.entityId !== '*') {
      removeEntity(event.entityId);
    }
  };

  const unsubCull = renderManager.subscribe(({ lod, visibleIds: nextVisible }) => {
    currentLod = lod;
    visibleIds = nextVisible;
    applyCullPass();
  });

  const unsubscribe = store.subscribe(onStoreChange);
  syncAll();

  return {
    syncAll: () => {
      syncAll();
    },
    destroy: () => {
      unsubCull();
      unsubscribe();
      for (const id of [...graphicsById.keys()]) removeGraphics(id);
      imageSprites.destroy();
      worldLayer.destroy({ children: true });
      selectionLayer.destroy({ children: true });
    },
  };
}

import { Container, Graphics } from 'pixi.js';
import type { Viewport } from 'pixi-viewport';
import type { StoreManager } from '../../lib/state/StoreManager';
import type { BoardEntity, DocumentNodeEntity, SpatialLink } from '../../lib/state/schema';
import { resolveLinkCurve } from '../../lib/spatial/linkAnchorResolver';
import type { RenderManager } from './RenderManager';
import type { LodState } from './lodPolicy';
import { boundsIntersect, type WorldBounds } from '../../lib/spatial/entityBounds';

export interface SpatialLinksLayerHandle {
  sync: () => void;
  destroy: () => void;
}

export function mountSpatialLinksLayer(
  viewport: Viewport,
  store: StoreManager,
  renderManager: RenderManager,
): SpatialLinksLayerHandle {
  const layer = new Container();
  layer.label = 'spatial-links';
  viewport.addChild(layer);

  const g = new Graphics();
  layer.addChild(g);

  let currentLod: LodState = renderManager.getLod();
  let viewportRect = renderManager.getViewportRect();
  let visibleIds = renderManager.getVisibleIds();

  const getEntity = (id: string): BoardEntity | null => store.getEntity(id);

  const curveBounds = (
    curve: ReturnType<typeof resolveLinkCurve>,
  ): WorldBounds => ({
    minX: Math.min(curve.x1, curve.x2, curve.cx1, curve.cx2),
    minY: Math.min(curve.y1, curve.y2, curve.cy1, curve.cy2),
    maxX: Math.max(curve.x1, curve.x2, curve.cx1, curve.cx2),
    maxY: Math.max(curve.y1, curve.y2, curve.cy1, curve.cy2),
  });

  const isLinkVisible = (link: SpatialLink): boolean => {
    const doc = getEntity(link.sourceDocumentId);
    const target = getEntity(link.targetShapeId);
    if (!doc || doc.type !== 'document' || !target) return false;

    if (visibleIds.has(doc.id) || visibleIds.has(target.id)) return true;

    const curve = resolveLinkCurve(doc as DocumentNodeEntity, link.charRange, target);
    return boundsIntersect(viewportRect, curveBounds(curve));
  };

  const sync = () => {
    g.clear();
    const links = store.getAllSpatialLinks();

    for (const link of links) {
      if (!isLinkVisible(link)) continue;
      drawLink(g, link, getEntity, currentLod);
    }
  };

  const unsubCull = renderManager.subscribe(({ lod, visibleIds: nextVisible, viewport }) => {
    currentLod = lod;
    visibleIds = nextVisible;
    viewportRect = viewport;
    sync();
  });

  const unsubStore = store.subscribe((ev) => {
    if (
      ev.kind === 'links-changed' ||
      ev.kind === 'reset' ||
      ev.kind === 'clear' ||
      ev.kind === 'update' ||
      ev.kind === 'preview'
    ) {
      sync();
    }
  });

  sync();

  return {
    sync,
    destroy() {
      unsubCull();
      unsubStore();
      layer.destroy({ children: true });
    },
  };
}

function drawLink(
  g: Graphics,
  link: SpatialLink,
  getEntity: (id: string) => BoardEntity | null,
  lod: LodState,
): void {
  const doc = getEntity(link.sourceDocumentId);
  const target = getEntity(link.targetShapeId);
  if (!doc || doc.type !== 'document' || !target) return;

  const curve = resolveLinkCurve(doc as DocumentNodeEntity, link.charRange, target);
  g.moveTo(curve.x1, curve.y1);
  g.bezierCurveTo(curve.cx1, curve.cy1, curve.cx2, curve.cy2, curve.x2, curve.y2);
  g.stroke({ color: 0x9b6bff, width: 2, alpha: 0.85 });

  if (lod.showLinkAnchors) {
    g.circle(curve.x1, curve.y1, 4);
    g.fill({ color: 0x9b6bff, alpha: 0.9 });
    g.circle(curve.x2, curve.y2, 4);
    g.fill({ color: 0x2f80ed, alpha: 0.9 });
  }
}

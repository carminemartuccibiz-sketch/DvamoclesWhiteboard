import type { FederatedPointerEvent } from 'pixi.js';
import type { Viewport } from 'pixi-viewport';
import type { Application } from 'pixi.js';
import {
  createArrowEntity,
  createDocumentNodeEntity,
  createEllipseEntity,
  createFreehandEntity,
  createLineEntity,
  createRectangleEntity,
  createEntityId,
  cloneEntity,
  recomputeBoundsFromPoints,
  type BoardEntity,
  type BoardEntityPatch,
} from '../../lib/state/schema';
import { entityStyleFromDefaults } from '../style/entityStyleFromDefaults';
import type { CanvasStyleDefaults } from '../style/canvasStyleDefaults';
import type { PreviewLayerHandle } from '../render/PreviewLayer';
import { hitTestEntitiesAtPoint } from './hitTest';

const MIN_SIZE = 4;

export interface CanvasInputBridge {
  getActiveTool(): string;
  getStyleDefaults(): CanvasStyleDefaults;
  getSelectedIds(): ReadonlySet<string>;
  setSelection(ids: string[]): void;
  clearSelection(): void;
  notifyChange(): void;
  getAllEntities(): BoardEntity[];
  addEntity(entity: BoardEntity, options?: { tracked?: boolean }): void;
  deleteEntity(id: string): void;
  beginGesture(gestureId: string, entityIds?: string[]): void;
  commitGesture(): void;
  cancelGesture(): void;
  registerGestureEntity(entityId: string): void;
  applyGesturePreview(entityId: string, patch: BoardEntityPatch): BoardEntity | null;
  appendFreehandPoints(entityId: string, points: number[]): BoardEntity | null;
  getPendingLinkSource: () => { documentId: string; charRange: [number, number]; excerpt: string } | null;
  completeSpatialLink: (targetShapeId: string) => void;
}

export interface CanvasInputHandle {
  setActiveTool(tool: string): void;
  refreshSelectionOverlay(): void;
  destroy(): void;
}

type DragMode =
  | { kind: 'none' }
  | { kind: 'create-rect'; variant: 'rectangle' | 'diamond' }
  | { kind: 'create-ellipse' }
  | { kind: 'create-line' }
  | { kind: 'create-arrow' }
  | { kind: 'create-draw'; entityId: string }
  | { kind: 'move'; entityId: string; origin: BoardEntity };

interface PointerSession {
  pointerId: number;
  startWorld: { x: number; y: number };
  currentWorld: { x: number; y: number };
  drag: DragMode;
}

function normalizeBox(x0: number, y0: number, x1: number, y1: number) {
  const x = Math.min(x0, x1);
  const y = Math.min(y0, y1);
  return { x, y, width: Math.abs(x1 - x0), height: Math.abs(y1 - y0) };
}

function setViewportPan(viewport: Viewport, enabled: boolean): void {
  const drag = viewport.plugins.get('drag');
  if (!drag) return;
  if (enabled) drag.resume();
  else drag.pause();
}

export function mountCanvasInputController(
  app: Application,
  viewport: Viewport,
  bridge: CanvasInputBridge,
  preview: PreviewLayerHandle,
): CanvasInputHandle {
  let activeTool = bridge.getActiveTool();
  let session: PointerSession | null = null;

  const canvas = app.canvas as HTMLCanvasElement;

  const screenToWorld = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return viewport.toWorld(sx, sy);
  };

  const style = () => entityStyleFromDefaults(bridge.getStyleDefaults());

  const applyPanForTool = (tool: string) => {
    setViewportPan(viewport, tool === 'pan');
    canvas.style.cursor =
      tool === 'pan'
        ? 'grab'
        : tool === 'select'
          ? 'default'
          : tool === 'link'
            ? 'crosshair'
            : 'crosshair';
  };

  applyPanForTool(activeTool);

  const finishPointer = () => {
    session = null;
    preview.show(null);
  };

  const buildRectPreview = (
    variant: 'rectangle' | 'diamond',
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ): BoardEntity => {
    const box = normalizeBox(x0, y0, x1, y1);
    return createRectangleEntity({
      id: 'preview',
      ...box,
      variant,
      style: style(),
    });
  };

  const buildEllipsePreview = (x0: number, y0: number, x1: number, y1: number): BoardEntity =>
    createEllipseEntity({ id: 'preview', ...normalizeBox(x0, y0, x1, y1), style: style() });

  const buildLinePreview = (
    type: 'line' | 'arrow',
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ): BoardEntity => {
    const box = normalizeBox(x0, y0, x1, y1);
    if (type === 'arrow') {
      return createArrowEntity({
        id: 'preview',
        x: x0,
        y: y0,
        endX: x1,
        endY: y1,
        width: box.width,
        height: box.height,
        style: style(),
      });
    }
    return createLineEntity({
      id: 'preview',
      x: x0,
      y: y0,
      endX: x1,
      endY: y1,
      width: box.width,
      height: box.height,
      style: style(),
    });
  };

  const onPointerDown = (event: FederatedPointerEvent) => {
    if (event.button !== 0) return;
    const world = screenToWorld(event.clientX, event.clientY);
    const tool = activeTool;

    if (tool === 'pan') return;

    if (tool === 'link') {
      const pending = bridge.getPendingLinkSource();
      if (!pending) return;
      const hit = hitTestEntitiesAtPoint(world.x, world.y, bridge.getAllEntities());
      if (hit && hit.id !== pending.documentId && hit.type !== 'document') {
        bridge.completeSpatialLink(hit.id);
      }
      return;
    }

    if (tool === 'eraser') {
      const hit = hitTestEntitiesAtPoint(world.x, world.y, bridge.getAllEntities());
      if (hit) bridge.deleteEntity(hit.id);
      return;
    }

    if (tool === 'select') {
      const hit = hitTestEntitiesAtPoint(world.x, world.y, bridge.getAllEntities());
      if (hit) {
        const multi = event.shiftKey;
        const current = bridge.getSelectedIds();
        if (multi) {
          const next = new Set(current);
          if (next.has(hit.id)) next.delete(hit.id);
          else next.add(hit.id);
          bridge.setSelection([...next]);
        } else {
          bridge.setSelection([hit.id]);
        }
        bridge.beginGesture(`move-${hit.id}`, [hit.id]);
        session = {
          pointerId: event.pointerId,
          startWorld: world,
          currentWorld: world,
          drag: {
            kind: 'move',
            entityId: hit.id,
            origin: cloneEntity(hit),
          },
        };
      } else {
        bridge.clearSelection();
        bridge.notifyChange();
      }
      return;
    }

    if (tool === 'text') {
      const id = createEntityId();
      bridge.addEntity(
        createDocumentNodeEntity({
          id,
          x: world.x,
          y: world.y,
          width: 200,
          height: 48,
          content: 'Double-click to edit',
          fontSize: 16,
          style: style(),
        }),
      );
      bridge.setSelection([id]);
      return;
    }

    if (tool === 'rectangle' || tool === 'diamond') {
      session = {
        pointerId: event.pointerId,
        startWorld: world,
        currentWorld: world,
        drag: {
          kind: 'create-rect',
          variant: tool === 'diamond' ? 'diamond' : 'rectangle',
        },
      };
      preview.show(buildRectPreview(session.drag.variant, world.x, world.y, world.x, world.y));
      return;
    }

    if (tool === 'circle') {
      session = {
        pointerId: event.pointerId,
        startWorld: world,
        currentWorld: world,
        drag: { kind: 'create-ellipse' },
      };
      preview.show(buildEllipsePreview(world.x, world.y, world.x, world.y));
      return;
    }

    if (tool === 'line' || tool === 'arrow') {
      session = {
        pointerId: event.pointerId,
        startWorld: world,
        currentWorld: world,
        drag: { kind: tool === 'arrow' ? 'create-arrow' : 'create-line' },
      };
      preview.show(buildLinePreview(tool, world.x, world.y, world.x, world.y));
      return;
    }

    if (tool === 'draw') {
      const id = createEntityId();
      const seed = createFreehandEntity({
        id,
        x: world.x,
        y: world.y,
        width: 1,
        height: 1,
        points: [world.x, world.y],
        style: style(),
      });
      bridge.addEntity(seed, { tracked: false });
      bridge.beginGesture(`draw-${id}`, [id]);
      session = {
        pointerId: event.pointerId,
        startWorld: world,
        currentWorld: world,
        drag: { kind: 'create-draw', entityId: id },
      };
      return;
    }
  };

  const onPointerMove = (event: FederatedPointerEvent) => {
    if (!session || session.pointerId !== event.pointerId) return;
    const world = screenToWorld(event.clientX, event.clientY);
    session.currentWorld = world;
    const { startWorld, drag } = session;

    if (drag.kind === 'move') {
      const origin = drag.origin;
      const dx = world.x - startWorld.x;
      const dy = world.y - startWorld.y;
      const patch: BoardEntityPatch = {
        x: origin.x + dx,
        y: origin.y + dy,
      };
      if (origin.type === 'line' || origin.type === 'arrow') {
        patch.endX = origin.endX + dx;
        patch.endY = origin.endY + dy;
      }
      if (origin.type === 'freehand') {
        const moved: number[] = [];
        for (let i = 0; i < origin.points.length; i += 2) {
          moved.push(origin.points[i]! + dx, origin.points[i + 1]! + dy);
        }
        patch.points = moved;
        Object.assign(patch, recomputeBoundsFromPoints(moved));
      }
      bridge.applyGesturePreview(drag.entityId, patch);
      return;
    }

    if (drag.kind === 'create-rect') {
      preview.show(
        buildRectPreview(drag.variant, startWorld.x, startWorld.y, world.x, world.y),
      );
      return;
    }

    if (drag.kind === 'create-ellipse') {
      preview.show(buildEllipsePreview(startWorld.x, startWorld.y, world.x, world.y));
      return;
    }

    if (drag.kind === 'create-line') {
      preview.show(buildLinePreview('line', startWorld.x, startWorld.y, world.x, world.y));
      return;
    }

    if (drag.kind === 'create-arrow') {
      preview.show(buildLinePreview('arrow', startWorld.x, startWorld.y, world.x, world.y));
      return;
    }

    if (drag.kind === 'create-draw') {
      bridge.appendFreehandPoints(drag.entityId, [world.x, world.y]);
    }
  };

  const onPointerUp = (event: FederatedPointerEvent) => {
    if (!session || session.pointerId !== event.pointerId) return;
    const world = session.currentWorld;
    const { startWorld, drag } = session;

    if (drag.kind === 'move') {
      bridge.commitGesture();
      bridge.notifyChange();
      finishPointer();
      return;
    }

    if (drag.kind === 'create-draw') {
      bridge.commitGesture();
      const entity = bridge.getAllEntities().find((e) => e.id === drag.entityId);
      if (entity && entity.type === 'freehand' && entity.points.length >= 4) {
        bridge.setSelection([entity.id]);
      } else {
        bridge.deleteEntity(drag.entityId);
      }
      finishPointer();
      return;
    }

    if (drag.kind === 'create-rect') {
      const box = normalizeBox(startWorld.x, startWorld.y, world.x, world.y);
      if (box.width >= MIN_SIZE && box.height >= MIN_SIZE) {
        const id = createEntityId();
        bridge.addEntity(
          createRectangleEntity({
            id,
            ...box,
            variant: drag.variant,
            style: style(),
          }),
        );
        bridge.setSelection([id]);
      }
      finishPointer();
      return;
    }

    if (drag.kind === 'create-ellipse') {
      const box = normalizeBox(startWorld.x, startWorld.y, world.x, world.y);
      if (box.width >= MIN_SIZE && box.height >= MIN_SIZE) {
        const id = createEntityId();
        bridge.addEntity(createEllipseEntity({ id, ...box, style: style() }));
        bridge.setSelection([id]);
      }
      finishPointer();
      return;
    }

    if (drag.kind === 'create-line' || drag.kind === 'create-arrow') {
      const dist = Math.hypot(world.x - startWorld.x, world.y - startWorld.y);
      if (dist >= MIN_SIZE) {
        const id = createEntityId();
        const box = normalizeBox(startWorld.x, startWorld.y, world.x, world.y);
        if (drag.kind === 'create-arrow') {
          bridge.addEntity(
            createArrowEntity({
              id,
              x: startWorld.x,
              y: startWorld.y,
              endX: world.x,
              endY: world.y,
              width: box.width,
              height: box.height,
              style: style(),
            }),
          );
        } else {
          bridge.addEntity(
            createLineEntity({
              id,
              x: startWorld.x,
              y: startWorld.y,
              endX: world.x,
              endY: world.y,
              width: box.width,
              height: box.height,
              style: style(),
            }),
          );
        }
        bridge.setSelection([id]);
      }
      finishPointer();
      return;
    }

    finishPointer();
  };

  viewport.eventMode = 'static';
  viewport.hitArea = app.screen;
  viewport.on('pointerdown', onPointerDown);
  viewport.on('pointermove', onPointerMove);
  viewport.on('pointerup', onPointerUp);
  viewport.on('pointerupoutside', onPointerUp);

  return {
    setActiveTool(tool: string) {
      activeTool = tool;
      applyPanForTool(tool);
      finishPointer();
      bridge.cancelGesture();
    },
    refreshSelectionOverlay() {
      bridge.notifyChange();
    },
    destroy() {
      viewport.off('pointerdown', onPointerDown);
      viewport.off('pointermove', onPointerMove);
      viewport.off('pointerup', onPointerUp);
      viewport.off('pointerupoutside', onPointerUp);
      finishPointer();
    },
  };
}

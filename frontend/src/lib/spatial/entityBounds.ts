import type { BoardEntity } from '../state/schema';

/** Axis-aligned bounding box in world space */
export interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const SELECTION_PAD = 4;

/**
 * Tight(ish) world-space AABB for culling and spatial indexing.
 * Lines/freehand include stroke padding so off-screen hit targets are not dropped early.
 */
export function getEntityAabb(entity: BoardEntity): WorldBounds {
  const strokePad = Math.max(8, (entity.style?.strokeWidth ?? 1) + 6);

  if (entity.type === 'line' || entity.type === 'arrow') {
    return {
      minX: Math.min(entity.x, entity.endX) - strokePad,
      minY: Math.min(entity.y, entity.endY) - strokePad,
      maxX: Math.max(entity.x, entity.endX) + strokePad,
      maxY: Math.max(entity.y, entity.endY) + strokePad,
    };
  }

  if (entity.type === 'freehand' && entity.points.length >= 2) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < entity.points.length; i += 2) {
      const px = entity.points[i]!;
      const py = entity.points[i + 1]!;
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
    }
    return {
      minX: minX - strokePad,
      minY: minY - strokePad,
      maxX: maxX + strokePad,
      maxY: maxY + strokePad,
    };
  }

  return {
    minX: entity.x,
    minY: entity.y,
    maxX: entity.x + entity.width,
    maxY: entity.y + entity.height,
  };
}

/** True when `box` does not overlap `view` at all (strict viewport culling). */
export function isEntirelyOutside(view: WorldBounds, box: WorldBounds): boolean {
  return box.maxX < view.minX || box.minX > view.maxX || box.maxY < view.minY || box.minY > view.maxY;
}

export function boundsIntersect(a: WorldBounds, b: WorldBounds): boolean {
  return !isEntirelyOutside(a, b);
}

export function getSelectionOutlineBounds(entity: BoardEntity): WorldBounds {
  const base = getEntityAabb(entity);
  return {
    minX: base.minX - SELECTION_PAD,
    minY: base.minY - SELECTION_PAD,
    maxX: base.maxX + SELECTION_PAD,
    maxY: base.maxY + SELECTION_PAD,
  };
}

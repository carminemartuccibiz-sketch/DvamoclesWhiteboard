import type { BoardEntity } from '../../lib/state/schema';

const HIT_PAD = 6;

function pointInRect(px: number, py: number, entity: BoardEntity): boolean {
  return (
    px >= entity.x - HIT_PAD &&
    px <= entity.x + entity.width + HIT_PAD &&
    py >= entity.y - HIT_PAD &&
    py <= entity.y + entity.height + HIT_PAD
  );
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-6) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function hitLine(px: number, py: number, entity: Extract<BoardEntity, { type: 'line' | 'arrow' }>): boolean {
  const threshold = Math.max(HIT_PAD, entity.style.strokeWidth + 4);
  return distToSegment(px, py, entity.x, entity.y, entity.endX, entity.endY) <= threshold;
}

function hitFreehand(px: number, py: number, entity: Extract<BoardEntity, { type: 'freehand' }>): boolean {
  const pts = entity.points;
  const threshold = Math.max(HIT_PAD, entity.style.strokeWidth + 4);
  for (let i = 0; i < pts.length - 2; i += 2) {
    const d = distToSegment(px, py, pts[i]!, pts[i + 1]!, pts[i + 2]!, pts[i + 3]!);
    if (d <= threshold) return true;
  }
  return pointInRect(px, py, entity);
}

function hitDiamond(px: number, py: number, entity: Extract<BoardEntity, { type: 'rectangle' }>): boolean {
  const cx = entity.x + entity.width / 2;
  const cy = entity.y + entity.height / 2;
  const nx = Math.abs(px - cx) / (entity.width / 2 + HIT_PAD);
  const ny = Math.abs(py - cy) / (entity.height / 2 + HIT_PAD);
  return nx + ny <= 1;
}

export function hitTestEntity(px: number, py: number, entity: BoardEntity): boolean {
  switch (entity.type) {
    case 'line':
    case 'arrow':
      return hitLine(px, py, entity);
    case 'freehand':
      return hitFreehand(px, py, entity);
    case 'rectangle':
      if (entity.variant === 'diamond') return hitDiamond(px, py, entity);
      return pointInRect(px, py, entity);
    case 'ellipse':
    case 'document':
    case 'image': {
      if (entity.type === 'image') return pointInRect(px, py, entity);
      const cx = entity.x + entity.width / 2;
      const cy = entity.y + entity.height / 2;
      const rx = entity.width / 2 + HIT_PAD;
      const ry = entity.height / 2 + HIT_PAD;
      const dx = (px - cx) / rx;
      const dy = (py - cy) / ry;
      return dx * dx + dy * dy <= 1;
    }
    default:
      return false;
  }
}

/** Top-most hit (last in array = highest z-order approximation) */
export function hitTestEntitiesAtPoint(
  px: number,
  py: number,
  entities: BoardEntity[],
): BoardEntity | null {
  for (let i = entities.length - 1; i >= 0; i--) {
    const entity = entities[i]!;
    if (hitTestEntity(px, py, entity)) return entity;
  }
  return null;
}

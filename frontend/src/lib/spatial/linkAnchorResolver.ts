import type { BoardEntity } from '../state/schema';
import { charRangeToWorldRect } from '../document/documentLayout';
import type { DocumentNodeEntity } from '../state/schema';

export interface WorldPoint {
  x: number;
  y: number;
}

export interface BezierCurve {
  x1: number;
  y1: number;
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
  x2: number;
  y2: number;
}

function entityCenter(entity: BoardEntity): WorldPoint {
  if (entity.type === 'line' || entity.type === 'arrow') {
    return { x: (entity.x + entity.endX) / 2, y: (entity.y + entity.endY) / 2 };
  }
  return { x: entity.x + entity.width / 2, y: entity.y + entity.height / 2 };
}

/** Nearest point on entity AABB border toward `toward` */
export function shapeBorderAnchor(entity: BoardEntity, toward: WorldPoint): WorldPoint {
  if (entity.type === 'line' || entity.type === 'arrow') {
    const dStart = Math.hypot(entity.x - toward.x, entity.y - toward.y);
    const dEnd = Math.hypot(entity.endX - toward.x, entity.endY - toward.y);
    return dStart < dEnd ? { x: entity.x, y: entity.y } : { x: entity.endX, y: entity.endY };
  }

  if (entity.type === 'freehand' && entity.points.length >= 2) {
    return { x: entity.points[0]!, y: entity.points[1]! };
  }

  const cx = entity.x + entity.width / 2;
  const cy = entity.y + entity.height / 2;
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) {
    return { x: cx, y: entity.y };
  }

  const hw = entity.width / 2;
  const hh = entity.height / 2;
  const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

export function resolveSourceAnchor(
  document: DocumentNodeEntity,
  charRange: [number, number],
): WorldPoint {
  const rect = charRangeToWorldRect(document, charRange);
  if (!rect) {
    return { x: document.x + document.width, y: document.y + 40 };
  }
  return {
    x: rect.x + rect.width,
    y: rect.y + rect.height / 2,
  };
}

export function resolveLinkCurve(
  document: DocumentNodeEntity,
  charRange: [number, number],
  target: BoardEntity,
): BezierCurve {
  const source = resolveSourceAnchor(document, charRange);
  const targetCenter = entityCenter(target);
  const targetPoint = shapeBorderAnchor(target, source);
  const dx = targetPoint.x - source.x;
  const dist = Math.hypot(dx, targetPoint.y - source.y);
  const curvature = Math.min(Math.max(dist * 0.35, 40), 220);

  return {
    x1: source.x,
    y1: source.y,
    cx1: source.x + curvature,
    cy1: source.y,
    cx2: targetPoint.x - curvature,
    cy2: targetPoint.y,
    x2: targetPoint.x,
    y2: targetPoint.y,
  };
}

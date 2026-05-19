import type { Graphics } from 'pixi.js';
import type { BoardEntity } from '../../lib/state/schema';
import { UI_HEX_BY_COLOR } from '../../components/properties/enginePalette';
import type { DvColorStyle } from '../../contracts/styles';
import { drawSketchyPolyline, isSketchyStroke } from './sketchStroke';

export function resolveColor(token: string): number {
  if (token.startsWith('#')) {
    return Number.parseInt(token.slice(1), 16);
  }
  const hex = UI_HEX_BY_COLOR[token as DvColorStyle];
  if (hex) return Number.parseInt(hex.slice(1), 16);
  return 0xffffff;
}

function fillAlphaFromMode(entity: BoardEntity): number {
  const mode = entity.style.fillMode ?? 'none';
  if (mode === 'none') return 0;
  if (mode === 'semi') return 0.35 * entity.style.opacity;
  if (mode === 'pattern') return 0.2 * entity.style.opacity;
  return entity.style.opacity;
}

function shouldPaintFill(entity: BoardEntity): boolean {
  return (entity.style.fillMode ?? 'none') !== 'none';
}

export function strokeOptions(entity: BoardEntity) {
  return {
    color: resolveColor(String(entity.style.strokeColor)),
    width: Math.max(entity.style.strokeWidth, 0.5),
    alpha: entity.style.opacity,
    cap: 'round' as const,
    join: 'round' as const,
  };
}

function drawDashedPath(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: BoardEntity['style']['strokeStyle'],
  stroke: ReturnType<typeof strokeOptions>,
): void {
  const dash = style === 'dashed' ? 10 : style === 'dotted' ? 4 : 0;
  const gap = style === 'dashed' ? 6 : style === 'dotted' ? 6 : 0;

  if (dash <= 0) {
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke({
      color: stroke.color,
      width: stroke.width,
      alpha: stroke.alpha,
      cap: stroke.cap,
      join: stroke.join,
    });
    return;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) return;

  const ux = dx / len;
  const uy = dy / len;
  let dist = 0;
  let draw = true;

  while (dist < len) {
    const seg = Math.min(draw ? dash : gap, len - dist);
    const sx = x1 + ux * dist;
    const sy = y1 + uy * dist;
    const ex = x1 + ux * (dist + seg);
    const ey = y1 + uy * (dist + seg);
    if (draw) {
      g.moveTo(sx, sy);
      g.lineTo(ex, ey);
    }
    dist += seg;
    draw = !draw;
  }

  g.stroke({
    color: stroke.color,
    width: stroke.width,
    alpha: stroke.alpha,
    cap: stroke.cap,
    join: stroke.join,
  });
}

function drawArrowhead(
  g: Graphics,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  stroke: ReturnType<typeof strokeOptions>,
  sketchy: boolean,
  seed: string,
  sloppiness: number,
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const size = Math.max(8, stroke.width * 3);
  const x1 = toX - size * Math.cos(angle - Math.PI / 6);
  const y1 = toY - size * Math.sin(angle - Math.PI / 6);
  const x2 = toX - size * Math.cos(angle + Math.PI / 6);
  const y2 = toY - size * Math.sin(angle + Math.PI / 6);

  if (sketchy) {
    drawSketchyPolyline(
      g,
      [
        { x: toX, y: toY },
        { x: x1, y: y1 },
      ],
      `${seed}-ah1`,
      sloppiness,
      stroke.width,
      stroke.color,
      stroke.alpha,
      false,
    );
    drawSketchyPolyline(
      g,
      [
        { x: toX, y: toY },
        { x: x2, y: y2 },
      ],
      `${seed}-ah2`,
      sloppiness,
      stroke.width,
      stroke.color,
      stroke.alpha,
      false,
    );
    return;
  }

  g.moveTo(toX, toY);
  g.lineTo(x1, y1);
  g.moveTo(toX, toY);
  g.lineTo(x2, y2);
  g.stroke({
    color: stroke.color,
    width: stroke.width,
    alpha: stroke.alpha,
    cap: stroke.cap,
    join: stroke.join,
  });
}

function diamondPoints(entity: Extract<BoardEntity, { type: 'rectangle' }>) {
  const cx = entity.x + entity.width / 2;
  const cy = entity.y + entity.height / 2;
  return [
    { x: cx, y: entity.y },
    { x: entity.x + entity.width, y: cy },
    { x: cx, y: entity.y + entity.height },
    { x: entity.x, y: cy },
  ];
}

function drawRectOrDiamond(
  g: Graphics,
  entity: Extract<BoardEntity, { type: 'rectangle' }>,
  stroke: ReturnType<typeof strokeOptions>,
  fillColor: number,
  fillA: number,
  sketchy: boolean,
): void {
  const isDiamond = entity.variant === 'diamond';

  if (isDiamond) {
    const pts = diamondPoints(entity);
    const flat = pts.flatMap((p) => [p.x, p.y]);
    if (shouldPaintFill(entity) && fillA > 0) {
      g.poly(flat);
      g.fill({ color: fillColor, alpha: fillA });
    }
    if (sketchy) {
      drawSketchyPolyline(g, pts, entity.id, entity.style.sloppiness, stroke.width, stroke.color, stroke.alpha, true);
    } else {
      g.poly(flat);
      g.stroke({ color: stroke.color, width: stroke.width, alpha: stroke.alpha });
    }
    return;
  }

  const radius = entity.cornerRadius ?? 0;
  if (shouldPaintFill(entity) && fillA > 0) {
    g.roundRect(entity.x, entity.y, entity.width, entity.height, radius);
    g.fill({ color: fillColor, alpha: fillA });
  }

  if (sketchy) {
    const pts = [
      { x: entity.x, y: entity.y },
      { x: entity.x + entity.width, y: entity.y },
      { x: entity.x + entity.width, y: entity.y + entity.height },
      { x: entity.x, y: entity.y + entity.height },
    ];
    drawSketchyPolyline(g, pts, entity.id, entity.style.sloppiness, stroke.width, stroke.color, stroke.alpha, true);
  } else {
    g.roundRect(entity.x, entity.y, entity.width, entity.height, radius);
    g.stroke({ color: stroke.color, width: stroke.width, alpha: stroke.alpha });
  }
}

function drawEllipse(
  g: Graphics,
  entity: Extract<BoardEntity, { type: 'ellipse' }>,
  stroke: ReturnType<typeof strokeOptions>,
  fillColor: number,
  fillA: number,
  sketchy: boolean,
): void {
  const cx = entity.x + entity.width / 2;
  const cy = entity.y + entity.height / 2;
  const rx = entity.width / 2;
  const ry = entity.height / 2;

  if (shouldPaintFill(entity) && fillA > 0) {
    g.ellipse(cx, cy, rx, ry);
    g.fill({ color: fillColor, alpha: fillA });
  }

  if (sketchy) {
    const segments = 24;
    const pts: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      pts.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry });
    }
    drawSketchyPolyline(g, pts, entity.id, entity.style.sloppiness, stroke.width, stroke.color, stroke.alpha, true);
  } else {
    g.ellipse(cx, cy, rx, ry);
    g.stroke({ color: stroke.color, width: stroke.width, alpha: stroke.alpha });
  }
}

export interface EntityDrawOptions {
  preview?: boolean;
  selected?: boolean;
  /** LOD: force cheap geometric strokes (no sketch jitter) */
  forceGeometric?: boolean;
}

export function renderEntityGraphics(
  g: Graphics,
  entity: BoardEntity,
  options?: EntityDrawOptions,
): void {
  g.clear();
  const stroke = strokeOptions(entity);
  const fillColor = resolveColor(String(entity.style.strokeColor));
  const fillA = fillAlphaFromMode(entity);
  const sketchy =
    !options?.forceGeometric && isSketchyStroke(entity.style.sloppiness);

  switch (entity.type) {
    case 'rectangle':
      drawRectOrDiamond(g, entity, stroke, fillColor, fillA, sketchy);
      break;
    case 'ellipse':
      drawEllipse(g, entity, stroke, fillColor, fillA, sketchy);
      break;
    case 'line': {
      if (sketchy) {
        drawSketchyPolyline(
          g,
          [
            { x: entity.x, y: entity.y },
            { x: entity.endX, y: entity.endY },
          ],
          entity.id,
          entity.style.sloppiness,
          stroke.width,
          stroke.color,
          stroke.alpha,
          false,
        );
      } else {
        drawDashedPath(g, entity.x, entity.y, entity.endX, entity.endY, entity.style.strokeStyle, stroke);
      }
      break;
    }
    case 'arrow': {
      if (sketchy) {
        drawSketchyPolyline(
          g,
          [
            { x: entity.x, y: entity.y },
            { x: entity.endX, y: entity.endY },
          ],
          entity.id,
          entity.style.sloppiness,
          stroke.width,
          stroke.color,
          stroke.alpha,
          false,
        );
      } else {
        drawDashedPath(g, entity.x, entity.y, entity.endX, entity.endY, entity.style.strokeStyle, stroke);
      }
      const headEnd = entity.arrowheadEnd ?? 'triangle';
      if (headEnd !== 'none') {
        drawArrowhead(g, entity.x, entity.y, entity.endX, entity.endY, stroke, sketchy, entity.id, entity.style.sloppiness);
      }
      break;
    }
    case 'freehand': {
      const pts = entity.points;
      if (pts.length >= 4) {
        if (sketchy) {
          const poly: Array<{ x: number; y: number }> = [];
          for (let i = 0; i < pts.length; i += 2) poly.push({ x: pts[i]!, y: pts[i + 1]! });
          drawSketchyPolyline(g, poly, entity.id, entity.style.sloppiness, stroke.width, stroke.color, stroke.alpha, false);
        } else {
          g.moveTo(pts[0]!, pts[1]!);
          for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i]!, pts[i + 1]!);
          g.stroke({
            color: stroke.color,
            width: stroke.width,
            alpha: stroke.alpha,
            cap: stroke.cap,
            join: stroke.join,
          });
        }
      }
      break;
    }
    default:
      break;
  }
}

export function drawSelectionOutline(g: Graphics, entity: BoardEntity): void {
  g.clear();
  const pad = 4;
  const stroke = { color: 0x2f80ed, width: 1.5, alpha: 0.95 };

  if (entity.type === 'line' || entity.type === 'arrow') {
    const minX = Math.min(entity.x, entity.endX) - pad;
    const minY = Math.min(entity.y, entity.endY) - pad;
    const maxX = Math.max(entity.x, entity.endX) + pad;
    const maxY = Math.max(entity.y, entity.endY) + pad;
    g.rect(minX, minY, maxX - minX, maxY - minY);
    g.stroke(stroke);
    return;
  }

  if (entity.type === 'freehand' && entity.points.length >= 2) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < entity.points.length; i += 2) {
      minX = Math.min(minX, entity.points[i]!);
      minY = Math.min(minY, entity.points[i + 1]!);
      maxX = Math.max(maxX, entity.points[i]!);
      maxY = Math.max(maxY, entity.points[i + 1]!);
    }
    g.rect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
    g.stroke(stroke);
    return;
  }

  g.rect(entity.x - pad, entity.y - pad, entity.width + pad * 2, entity.height + pad * 2);
  g.stroke(stroke);
}

/** Pattern hatch overlay for fillMode pattern (stroke-independent) */
export function drawPatternFill(g: Graphics, entity: BoardEntity): void {
  if (entity.style.fillMode !== 'pattern') return;
  const color = resolveColor(String(entity.style.strokeColor));
  const alpha = 0.25 * entity.style.opacity;
  const step = 10;
  const x0 = entity.x;
  const y0 = entity.y;
  const x1 = entity.x + entity.width;
  const y1 = entity.y + entity.height;

  for (let d = x0 - entity.height; d < x1; d += step) {
    g.moveTo(d, y0);
    g.lineTo(d + entity.height, y1);
  }
  g.stroke({ color, width: 1, alpha });
}

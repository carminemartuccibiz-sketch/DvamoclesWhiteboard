import { Rectangle, RenderTexture } from 'pixi.js';
import type { Application } from 'pixi.js';
import type { Viewport } from 'pixi-viewport';
import type { BoardEntity } from '../state/schema';
import type { Bounds } from '../../engine/EngineContext';
import { computeEntitiesBounds } from '../spatial/canvasBounds';
import { UI_HEX_BY_COLOR } from '../../components/properties/enginePalette';
import type { DvColorStyle } from '../../contracts/styles';

function resolveHex(token: string): string {
  if (token.startsWith('#')) return token;
  return UI_HEX_BY_COLOR[token as DvColorStyle] ?? '#ffffff';
}

function entityToSvgFragment(entity: BoardEntity): string {
  const stroke = resolveHex(String(entity.style.strokeColor));
  const sw = entity.style.strokeWidth;
  const op = entity.style.opacity;

  switch (entity.type) {
    case 'rectangle': {
      const fill =
        entity.style.fillMode !== 'none'
          ? ` fill="${stroke}" fill-opacity="${entity.style.fillMode === 'semi' ? 0.35 * op : op}"`
          : ' fill="none"';
      return `<rect x="${entity.x}" y="${entity.y}" width="${entity.width}" height="${entity.height}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"${fill}/>`;
    }
    case 'ellipse': {
      const cx = entity.x + entity.width / 2;
      const cy = entity.y + entity.height / 2;
      const fill =
        entity.style.fillMode !== 'none'
          ? ` fill="${stroke}" fill-opacity="${entity.style.fillMode === 'semi' ? 0.35 * op : op}"`
          : ' fill="none"';
      return `<ellipse cx="${cx}" cy="${cy}" rx="${entity.width / 2}" ry="${entity.height / 2}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"${fill}/>`;
    }
    case 'line':
    case 'arrow':
      return `<line x1="${entity.x}" y1="${entity.y}" x2="${entity.endX}" y2="${entity.endY}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" stroke-linecap="round"/>`;
    case 'freehand': {
      const pts = entity.points;
      if (pts.length < 4) return '';
      let d = `M ${pts[0]} ${pts[1]}`;
      for (let i = 2; i < pts.length; i += 2) d += ` L ${pts[i]} ${pts[i + 1]}`;
      return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    case 'document':
      return `<rect x="${entity.x}" y="${entity.y}" width="${entity.width}" height="${entity.height}" rx="8" stroke="#3f3f46" stroke-width="1" fill="#0c0c10" opacity="${op}"/><text x="${entity.x + 14}" y="${entity.y + 24}" fill="#a1a1aa" font-size="11" font-family="monospace">${escapeXml(entity.title)}</text>`;
    default:
      return '';
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function exportViewportToPng(
  app: Application,
  viewport: Viewport,
  entities: BoardEntity[],
): Promise<Blob | null> {
  const bounds = computeEntitiesBounds(entities);
  if (!bounds) return null;

  const w = Math.ceil(bounds.maxX - bounds.minX);
  const h = Math.ceil(bounds.maxY - bounds.minY);
  if (w <= 0 || h <= 0) return null;

  const prevCenter = { x: viewport.center.x, y: viewport.center.y };
  const prevScale = viewport.scale.x;

  viewport.scale.set(1);
  viewport.moveCenter(bounds.minX + w / 2, bounds.minY + h / 2);

  const texture = RenderTexture.create({
    width: w,
    height: h,
    resolution: 2,
  });

  const frame = new Rectangle(bounds.minX, bounds.minY, w, h);
  app.renderer.render({
    container: viewport,
    target: texture,
    clear: '#030306',
    frame,
  });

  viewport.scale.set(prevScale);
  viewport.moveCenter(prevCenter.x, prevCenter.y);

  const canvas = app.renderer.extract.canvas(texture);
  texture.destroy(true);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export function exportEntitiesToSvg(entities: BoardEntity[], bounds: Bounds): string {
  const w = bounds.maxX - bounds.minX;
  const h = bounds.maxY - bounds.minY;
  const body = entities.map(entityToSvgFragment).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minX} ${bounds.minY} ${w} ${h}" width="${w}" height="${h}">
  <rect x="${bounds.minX}" y="${bounds.minY}" width="${w}" height="${h}" fill="#030306"/>
  ${body}
</svg>`;
}

import type { useEngine } from '../engine/EngineContext';
import { exportEntitiesToSvg } from './export/canvasExport';

type EngineApi = ReturnType<typeof useEngine>;

function sanitizeFilename(title: string) {
  const base = title.trim() || 'Untitled Project';
  return base.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 120);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** PNG export of all entities in world bounds (via Pixi render texture) */
export async function exportDocumentAsPng(engine: EngineApi, documentTitle: string) {
  const blob = await engine.capturePng();
  if (!blob) return;
  downloadBlob(blob, `${sanitizeFilename(documentTitle)}.png`);
}

/** SVG export of all shapes in content bounds */
export async function exportDocumentAsSvg(engine: EngineApi, documentTitle: string) {
  const bounds = engine.getContentBounds();
  if (!bounds) return;
  const entities = engine.getAllEntities();
  const svg = exportEntitiesToSvg(entities, bounds);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  downloadBlob(blob, `${sanitizeFilename(documentTitle)}.svg`);
}

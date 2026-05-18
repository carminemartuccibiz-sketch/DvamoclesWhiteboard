import type { Editor, TLShapeId } from 'tldraw';

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

export function getExportShapeIds(editor: Editor): TLShapeId[] {
  const selected = editor.getSelectedShapeIds();
  if (selected.length > 0) return [...selected];
  return [...editor.getCurrentPageShapeIds()];
}

export function getExportBounds(editor: Editor, ids: TLShapeId[]) {
  if (ids.length === 0) return undefined;
  const selected = editor.getSelectedShapeIds();
  if (selected.length > 0) {
    return editor.getSelectionPageBounds() ?? editor.getCurrentPageBounds();
  }
  return editor.getCurrentPageBounds();
}

export async function exportDocumentAsPng(
  editor: Editor,
  documentTitle: string,
  darkMode?: boolean,
) {
  const ids = getExportShapeIds(editor);
  if (ids.length === 0) return;

  const bounds = getExportBounds(editor, ids);
  const { blob } = await editor.toImage(ids, {
    format: 'png',
    bounds,
    background: true,
    darkMode,
    padding: 'auto',
    pixelRatio: 2,
  });

  downloadBlob(blob, `${sanitizeFilename(documentTitle)}.png`);
}

export async function exportDocumentAsSvg(
  editor: Editor,
  documentTitle: string,
  darkMode?: boolean,
) {
  const ids = getExportShapeIds(editor);
  if (ids.length === 0) return;

  const bounds = getExportBounds(editor, ids);
  const result = await editor.getSvgString(ids, {
    bounds,
    background: true,
    darkMode,
    padding: 'auto',
  });

  if (!result?.svg) return;

  const blob = new Blob([result.svg], { type: 'image/svg+xml' });
  downloadBlob(blob, `${sanitizeFilename(documentTitle)}.svg`);
}

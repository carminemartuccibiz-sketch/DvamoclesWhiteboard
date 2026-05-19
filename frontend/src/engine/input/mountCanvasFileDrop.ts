import { parseTextDocument, isTextImportFile } from '../../lib/document/parseTextDocument';
import { createDocumentNodeEntity, createEntityId } from '../../lib/state/schema';

export interface FileDropBridge {
  screenToWorld: (clientX: number, clientY: number) => { x: number; y: number };
  addDocumentFromFile: (file: File, worldX: number, worldY: number) => Promise<void>;
}

export function mountCanvasFileDrop(
  container: HTMLElement,
  bridge: FileDropBridge,
): () => void {
  let dragDepth = 0;

  const dropzone = document.createElement('div');
  dropzone.className = 'dv-canvas-dropzone';
  dropzone.style.cssText =
    'position:absolute;inset:0;pointer-events:none;z-index:3;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.15s;';
  const label = document.createElement('div');
  label.className = 'dv-canvas-dropzone-label';
  label.textContent = 'Drop .md or .txt to create Document Node';
  dropzone.appendChild(label);
  container.appendChild(dropzone);

  const show = () => {
    dropzone.style.opacity = '1';
    dropzone.style.pointerEvents = 'auto';
  };
  const hide = () => {
    dropzone.style.opacity = '0';
    dropzone.style.pointerEvents = 'none';
  };

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    dragDepth++;
    show();
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) hide();
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    dragDepth = 0;
    hide();

    const files = [...(e.dataTransfer?.files ?? [])].filter(isTextImportFile);
    if (files.length === 0) return;

    const world = bridge.screenToWorld(e.clientX, e.clientY);
    let offsetY = 0;
    for (const file of files) {
      await bridge.addDocumentFromFile(file, world.x, world.y + offsetY);
      offsetY += 340;
    }
  };

  container.addEventListener('dragenter', onDragEnter);
  container.addEventListener('dragleave', onDragLeave);
  container.addEventListener('dragover', onDragOver);
  container.addEventListener('drop', onDrop);

  return () => {
    container.removeEventListener('dragenter', onDragEnter);
    container.removeEventListener('dragleave', onDragLeave);
    container.removeEventListener('dragover', onDragOver);
    container.removeEventListener('drop', onDrop);
    dropzone.remove();
  };
}

export async function buildDocumentEntityFromFile(
  file: File,
  worldX: number,
  worldY: number,
) {
  const raw = await file.text();
  const parsed = parseTextDocument(raw, file.name);
  const width = 360;
  const height = 300;
  return createDocumentNodeEntity({
    id: createEntityId(),
    x: worldX - width / 2,
    y: worldY - height / 2,
    width,
    height,
    title: parsed.title,
    plainText: parsed.plainText,
    content: parsed.plainText,
    blocks: parsed.blocks,
    scrollY: 0,
    sourceFileName: file.name,
    fontSize: 14,
  });
}

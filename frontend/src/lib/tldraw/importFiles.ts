import {
  createShapeId,
  toRichText,
  type Editor,
  type VecLike,
} from 'tldraw';

function isImageFile(file: File) {
  return file.type.startsWith('image/');
}

export function createFileCardPlaceholder(
  editor: Editor,
  fileName: string,
  point: VecLike,
) {
  const id = createShapeId();
  const w = 280;
  const h = 72;

  editor.createShapes([
    {
      id,
      type: 'geo',
      x: point.x - w / 2,
      y: point.y - h / 2,
      props: {
        geo: 'rectangle',
        w,
        h,
        fill: 'semi',
        dash: 'solid',
        richText: toRichText(`📄 ${fileName}`),
      },
      meta: { fileCard: true, fileName },
    },
  ]);

  editor.select(id);
}

export async function importFilesAtPoint(
  editor: Editor,
  files: File[],
  point?: VecLike,
) {
  const dropPoint =
    point ?? editor.getViewportPageBounds().center;

  const imageFiles: File[] = [];
  const otherFiles: File[] = [];

  for (const file of files) {
    if (isImageFile(file)) {
      imageFiles.push(file);
    } else {
      otherFiles.push(file);
    }
  }

  if (imageFiles.length > 0) {
    await editor.putExternalContent({
      type: 'files',
      files: imageFiles,
      point: dropPoint,
    });
  }

  const stagger = 96;
  otherFiles.forEach((file, index) => {
    createFileCardPlaceholder(editor, file.name, {
      x: dropPoint.x + index * stagger,
      y: dropPoint.y + index * stagger,
    });
  });
}

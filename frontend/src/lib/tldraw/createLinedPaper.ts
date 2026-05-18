import { createShapeId, type Editor, type TLShapeId } from 'tldraw';

const PAPER_W = 480;
const PAPER_H = 640;
const PAD_X = 36;
const PAD_TOP = 56;
const LINE_SPACING = 28;

export function createLinedPaper(editor: Editor) {
  const viewport = editor.getViewportPageBounds();
  const center = viewport?.center ?? { x: 0, y: 0 };
  const originX = center.x - PAPER_W / 2;
  const originY = center.y - PAPER_H / 2;

  const paperId = createShapeId();
  const lineIds: TLShapeId[] = [];
  const lineW = PAPER_W - PAD_X * 2;
  const lineCount = Math.floor((PAPER_H - PAD_TOP - 48) / LINE_SPACING);

  editor.run(() => {
    editor.createShapes([
      {
        id: paperId,
        type: 'geo',
        x: originX,
        y: originY,
        props: {
          geo: 'rectangle',
          w: PAPER_W,
          h: PAPER_H,
          fill: 'solid',
          color: 'white',
          dash: 'solid',
          size: 'm',
        },
      },
    ]);

    for (let i = 0; i < lineCount; i++) {
      const lineId = createShapeId();
      lineIds.push(lineId);
      const y = originY + PAD_TOP + i * LINE_SPACING;

      editor.createShapes([
        {
          id: lineId,
          type: 'line',
          x: originX + PAD_X,
          y,
          props: {
            color: 'grey',
            dash: 'solid',
            size: 's',
            spline: 'line',
            scale: 1,
            points: {
              start: { id: 'start', index: 'a1', x: 0, y: 0 },
              end: { id: 'end', index: 'a2', x: lineW, y: 0 },
            },
          },
        },
      ]);
    }

    const groupId = createShapeId();
    editor.groupShapes([paperId, ...lineIds], { groupId, select: true });
    editor.zoomToSelection({ animation: { duration: 280 } });
  });
}

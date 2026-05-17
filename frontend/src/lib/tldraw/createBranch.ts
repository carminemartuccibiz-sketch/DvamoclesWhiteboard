import {
  createBindingId,
  createShapeId,
  type Editor,
  type TLShape,
  type TLShapeId,
} from 'tldraw';

function connectWithArrow(editor: Editor, fromId: TLShapeId, toId: TLShapeId) {
  const arrowId = createShapeId();

  editor.createShapes([
    {
      id: arrowId,
      type: 'arrow',
      x: 0,
      y: 0,
      props: {
        start: { x: 0, y: 0 },
        end: { x: 0, y: 0 },
      },
    },
  ]);

  editor.createBindings([
    {
      id: createBindingId(),
      type: 'arrow',
      fromId: arrowId,
      toId: fromId,
      props: {
        terminal: 'start',
        isExact: false,
        normalizedAnchor: { x: 0.5, y: 1 },
        isPrecise: false,
      },
    },
    {
      id: createBindingId(),
      type: 'arrow',
      fromId: arrowId,
      toId: toId,
      props: {
        terminal: 'end',
        isExact: false,
        normalizedAnchor: { x: 0.5, y: 0 },
        isPrecise: false,
      },
    },
  ]);
}

export function createBranchFromSelection(editor: Editor, branchCount = 3) {
  const selected = editor.getSelectedShapes();
  if (selected.length === 0) return false;

  const parent: TLShape = selected[0];
  const bounds = editor.getShapePageBounds(parent);
  if (!bounds) return false;

  const childW = 160;
  const childH = 80;
  const verticalGap = 140;
  const horizontalGap = 48;
  const totalWidth =
    branchCount * childW + (branchCount - 1) * horizontalGap;
  const startX = bounds.center.x - totalWidth / 2;
  const childY = bounds.maxY + verticalGap;

  const childIds: TLShapeId[] = [];

  editor.run(() => {
    for (let i = 0; i < branchCount; i++) {
      const id = createShapeId();
      childIds.push(id);

      editor.createShapes([
        {
          id,
          type: 'geo',
          x: startX + i * (childW + horizontalGap),
          y: childY,
          props: {
            geo: 'rectangle',
            w: childW,
            h: childH,
          },
        },
      ]);

      connectWithArrow(editor, parent.id, id);
    }

    editor.select(...childIds);
  });

  return true;
}

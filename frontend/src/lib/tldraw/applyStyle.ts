import type { Editor, StyleProp } from 'tldraw';

export function applyStyle<T>(
  editor: Editor,
  style: StyleProp<T>,
  value: T,
) {
  editor.setStyleForNextShapes(style, value);
  if (editor.getSelectedShapeIds().length > 0) {
    editor.setStyleForSelectedShapes(style, value);
  }
}

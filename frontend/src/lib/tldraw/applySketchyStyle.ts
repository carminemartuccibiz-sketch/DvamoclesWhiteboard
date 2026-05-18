import { DefaultDashStyle, DefaultFontStyle, type Editor } from 'tldraw';
import { applyStyle } from './applyStyle';

/** Hand-drawn stroke + label font only; fill stays user-controlled */
export function applySketchyStyle(editor: Editor) {
  applyStyle(editor, DefaultDashStyle, 'draw');
  applyStyle(editor, DefaultFontStyle, 'draw');
}

export function applyStraightStroke(editor: Editor, dash: 'solid' | 'dashed' | 'dotted') {
  applyStyle(editor, DefaultDashStyle, dash);
}

import {
  DefaultDashStyle,
  DefaultFillStyle,
  DefaultFontStyle,
  type Editor,
} from 'tldraw';
import { applyStyle } from './applyStyle';

/** Excalidraw-style hand-drawn preset for tldraw v5 */
export function applySketchyStyle(editor: Editor) {
  applyStyle(editor, DefaultDashStyle, 'draw');
  applyStyle(editor, DefaultFillStyle, 'pattern');
  applyStyle(editor, DefaultFontStyle, 'draw');
}

export function applyStraightStroke(editor: Editor, dash: 'solid' | 'dashed' | 'dotted') {
  applyStyle(editor, DefaultDashStyle, dash);
}

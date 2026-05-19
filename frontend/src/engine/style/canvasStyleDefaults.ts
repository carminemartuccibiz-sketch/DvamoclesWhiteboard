import type { DvColorStyle, DvFillStyle, DvSizeStyle } from '../../contracts/styles';
import { DEFAULT_STYLE_BAG } from '../../contracts/styles';
import type { StrokeStyleKind } from '../../lib/state/schema';
import type { SloppinessUi } from '../../components/properties/sections/SloppinessSection';
import type { StrokeUiStyle } from '../../components/properties/sections/StrokeStyleSection';

export interface CanvasStyleDefaults {
  strokeColor: DvColorStyle;
  fillStyle: DvFillStyle;
  strokeStyle: StrokeUiStyle;
  strokeWidth: DvSizeStyle;
  sloppiness: SloppinessUi;
  /** 0–100 UI percent */
  opacity: number;
}

export const DEFAULT_CANVAS_STYLE: CanvasStyleDefaults = {
  strokeColor: DEFAULT_STYLE_BAG.color,
  fillStyle: DEFAULT_STYLE_BAG.fill,
  strokeStyle: 'solid',
  strokeWidth: DEFAULT_STYLE_BAG.size,
  sloppiness: 'straight',
  opacity: 100,
};

export function strokeUiToKind(ui: StrokeUiStyle): StrokeStyleKind {
  if (ui === 'dashed') return 'dashed';
  if (ui === 'dotted') return 'dotted';
  return 'solid';
}

export const SIZE_TO_STROKE_WIDTH: Record<DvSizeStyle, number> = {
  s: 1,
  m: 2,
  l: 4,
  xl: 6,
};

import type { EntityStyle } from '../../lib/state/schema';
import { normalizeEntityStyle, sloppinessUiToValue } from '../../lib/state/schema';
import type { CanvasStyleDefaults } from './canvasStyleDefaults';
import { SIZE_TO_STROKE_WIDTH, strokeUiToKind } from './canvasStyleDefaults';

/**
 * Maps RightSidebar defaults → persisted entity style.
 * Sloppiness affects stroke jitter only; fillMode is independent.
 */
export function entityStyleFromDefaults(defaults: CanvasStyleDefaults): EntityStyle {
  const fillMode = defaults.fillStyle;
  const strokeColor = defaults.strokeColor;

  let fillColor: EntityStyle['fillColor'] = 'none';
  if (fillMode === 'none') {
    fillColor = 'none';
  } else {
    fillColor = strokeColor;
  }

  return normalizeEntityStyle({
    strokeColor,
    fillColor,
    fillMode,
    strokeWidth: SIZE_TO_STROKE_WIDTH[defaults.strokeWidth],
    strokeStyle: strokeUiToKind(defaults.strokeStyle),
    opacity: defaults.opacity / 100,
    sloppiness: sloppinessUiToValue(defaults.sloppiness),
  });
}

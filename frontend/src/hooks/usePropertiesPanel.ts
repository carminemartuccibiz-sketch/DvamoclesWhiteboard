import { useCallback } from 'react';
import type { DvColorStyle, DvFillStyle, DvSizeStyle } from '../contracts/styles';
import type { FillUiStyle } from '../components/properties/sections/FillStyleSection';
import type { SloppinessUi } from '../components/properties/sections/SloppinessSection';
import type { StrokeUiStyle } from '../components/properties/sections/StrokeStyleSection';
import type { SizeUi } from '../components/properties/sections/StrokeWidthSection';
import { useEngine } from '../engine/EngineContext';
export function usePropertiesPanel() {
  const engine = useEngine();
  const { styleDefaults: s, selectedIds } = engine;

  const touchSelection = useCallback(() => {
    if (selectedIds.size > 0) engine.applyStyleToSelection();
  }, [engine, selectedIds]);

  const handleColorSelect = useCallback(
    (color: DvColorStyle) => {
      engine.setStrokeColor(color);
      touchSelection();
    },
    [engine, touchSelection],
  );

  const handleFillChange = useCallback(
    (value: DvFillStyle) => {
      if (value === 'none' || value === 'semi' || value === 'solid' || value === 'pattern') {
        engine.setFillStyle(value);
        touchSelection();
      }
    },
    [engine, touchSelection],
  );

  const handleSloppinessChange = useCallback(
    (value: SloppinessUi) => {
      engine.setSloppiness(value);
      touchSelection();
    },
    [engine, touchSelection],
  );

  const handleStrokeStyleChange = useCallback(
    (value: StrokeUiStyle) => {
      engine.setStrokeStyle(value);
      touchSelection();
    },
    [engine, touchSelection],
  );

  const handleStrokeWidthChange = useCallback(
    (value: DvSizeStyle) => {
      engine.setStrokeWidth(value);
      touchSelection();
    },
    [engine, touchSelection],
  );

  const handleOpacityChange = useCallback(
    (value: number[]) => {
      engine.setOpacity(value[0] ?? 100);
      touchSelection();
    },
    [engine, touchSelection],
  );

  return {
    objectIdLabel: engine.selectionLabel,
    activeColor: s.strokeColor,
    fillStyle: s.fillStyle as FillUiStyle,
    sloppiness: s.sloppiness,
    strokeStyle: s.strokeStyle,
    strokeWidth: s.strokeWidth as SizeUi,
    opacity: [s.opacity],
    handleColorSelect,
    handleFillChange,
    handleSloppinessChange,
    handleStrokeStyleChange,
    handleStrokeWidthChange,
    handleOpacityChange,
  };
}

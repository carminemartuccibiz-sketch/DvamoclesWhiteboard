import { useCallback, useEffect, useState } from 'react';
import {
  DefaultColorStyle,
  DefaultDashStyle,
  DefaultFillStyle,
  DefaultFontStyle,
  DefaultSizeStyle,
  useEditor,
  type TLDefaultColorStyle,
  type TLDefaultDashStyle,
  type TLDefaultFillStyle,
  type TLDefaultSizeStyle,
} from 'tldraw';
import { applyStyle } from '../lib/tldraw/applyStyle';
import { applySketchyStyle, applyStraightStroke } from '../lib/tldraw/applySketchyStyle';
import { UI_HEX_BY_TLDRAW_COLOR } from '../components/properties/sections/ColorPickerSection';
import type { FillUiStyle } from '../components/properties/sections/FillStyleSection';
import type { SloppinessUi } from '../components/properties/sections/SloppinessSection';
import type { StrokeUiStyle } from '../components/properties/sections/StrokeStyleSection';
import type { SizeUi } from '../components/properties/sections/StrokeWidthSection';

function stripShapePrefix(id: string) {
  return id.replace(/^shape:/, '');
}

function isSketchySloppiness(
  dash: TLDefaultDashStyle | undefined,
  font: string | undefined,
): boolean {
  return dash === 'draw' && font === 'draw';
}

export function usePropertiesPanel() {
  const editor = useEditor();
  const [objectIdLabel, setObjectIdLabel] = useState('No Selection');
  const [activeColorHex, setActiveColorHex] = useState('#000000');
  const [fillStyle, setFillStyle] = useState<FillUiStyle>('none');
  const [sloppiness, setSloppiness] = useState<SloppinessUi>('straight');
  const [strokeStyle, setStrokeStyle] = useState<StrokeUiStyle>('solid');
  const [strokeWidth, setStrokeWidth] = useState<SizeUi>('m');
  const [opacity, setOpacity] = useState([100]);

  const syncFromEditor = useCallback(() => {
    const selected = editor.getSelectedShapes();

    if (selected.length === 0) {
      setObjectIdLabel('No Selection');
    } else if (selected.length === 1) {
      setObjectIdLabel(stripShapePrefix(selected[0].id));
    } else {
      setObjectIdLabel(`${selected.length} Objects Selected`);
    }

    const colorStyle = editor.getSharedStyles().get(DefaultColorStyle);
    if (colorStyle?.type === 'shared') {
      setActiveColorHex(UI_HEX_BY_TLDRAW_COLOR[colorStyle.value] ?? '#000000');
    }

    const fill = editor.getSharedStyles().get(DefaultFillStyle);
    const dash = editor.getSharedStyles().get(DefaultDashStyle);
    const font = editor.getSharedStyles().get(DefaultFontStyle);

    const fillValue = fill?.type === 'shared' ? fill.value : undefined;
    const dashValue = dash?.type === 'shared' ? dash.value : undefined;
    const fontValue = font?.type === 'shared' ? font.value : undefined;

    if (
      fillValue === 'none' ||
      fillValue === 'semi' ||
      fillValue === 'solid' ||
      fillValue === 'pattern'
    ) {
      setFillStyle(fillValue);
    }

    if (isSketchySloppiness(dashValue, fontValue)) {
      setSloppiness('sketchy');
    } else {
      setSloppiness('straight');
      if (dashValue === 'solid' || dashValue === 'dashed' || dashValue === 'dotted') {
        setStrokeStyle(dashValue);
      }
    }

    const sizeStyle = editor.getSharedStyles().get(DefaultSizeStyle);
    if (sizeStyle?.type === 'shared') {
      setStrokeWidth(sizeStyle.value);
    }

    const sharedOpacity = editor.getSharedOpacity();
    if (sharedOpacity.type === 'shared') {
      setOpacity([Math.round(sharedOpacity.value * 100)]);
    }
  }, [editor]);

  useEffect(() => {
    syncFromEditor();
    const unlisten = editor.store.listen(syncFromEditor);
    return () => unlisten();
  }, [editor, syncFromEditor]);

  const handleColorSelect = (tldrawColor: TLDefaultColorStyle) => {
    applyStyle(editor, DefaultColorStyle, tldrawColor);
    setActiveColorHex(UI_HEX_BY_TLDRAW_COLOR[tldrawColor]);
  };

  const handleFillChange = (value: TLDefaultFillStyle) => {
    if (value === 'none' || value === 'semi' || value === 'solid' || value === 'pattern') {
      setFillStyle(value);
    }
    applyStyle(editor, DefaultFillStyle, value);
  };

  const handleSloppinessChange = (value: SloppinessUi) => {
    setSloppiness(value);
    if (value === 'sketchy') {
      applySketchyStyle(editor);
      return;
    }
    applyStraightStroke(editor, strokeStyle);
  };

  const handleStrokeStyleChange = (value: TLDefaultDashStyle) => {
    setStrokeStyle(value as StrokeUiStyle);
    if (sloppiness === 'straight') {
      applyStraightStroke(editor, value as StrokeUiStyle);
    }
  };

  const handleStrokeWidthChange = (value: TLDefaultSizeStyle) => {
    setStrokeWidth(value);
    applyStyle(editor, DefaultSizeStyle, value);
  };

  const handleOpacityChange = (value: number[]) => {
    const next = value[0] ?? 100;
    setOpacity([next]);
    const normalized = next / 100;
    editor.setOpacityForNextShapes(normalized);
    if (editor.getSelectedShapeIds().length > 0) {
      editor.setOpacityForSelectedShapes(normalized);
    }
  };

  return {
    objectIdLabel,
    activeColorHex,
    fillStyle,
    sloppiness,
    strokeStyle,
    strokeWidth,
    opacity,
    handleColorSelect,
    handleFillChange,
    handleSloppinessChange,
    handleStrokeStyleChange,
    handleStrokeWidthChange,
    handleOpacityChange,
    setActiveColorHex,
  };
}

import { useCallback, useEffect, useState } from 'react';
import {
  DefaultColorStyle,
  DefaultDashStyle,
  DefaultFillStyle,
  DefaultSizeStyle,
  useEditor,
  type TLDefaultColorStyle,
  type TLDefaultDashStyle,
  type TLDefaultFillStyle,
  type TLDefaultSizeStyle,
} from 'tldraw';
import { applyStyle } from '../../lib/tldraw/applyStyle';
import { ColorPickerSection, UI_HEX_BY_TLDRAW_COLOR } from './sections/ColorPickerSection';
import { FillStyleSection, type FillUiStyle } from './sections/FillStyleSection';
import { ObjectIdSection } from './sections/ObjectIdSection';
import { OpacitySection } from './sections/OpacitySection';
import { SloppinessSection, type SloppinessUi } from './sections/SloppinessSection';
import { StrokeStyleSection, type StrokeUiStyle } from './sections/StrokeStyleSection';
import { StrokeWidthSection, type SizeUi } from './sections/StrokeWidthSection';

function stripShapePrefix(id: string) {
  return id.replace(/^shape:/, '');
}

export function PropertiesPanel() {
  const editor = useEditor();
  const [objectIdLabel, setObjectIdLabel] = useState('No Selection');
  const [activeColorHex, setActiveColorHex] = useState('#000000');
  const [fillStyle, setFillStyle] = useState<FillUiStyle>('none');
  const [sloppiness, setSloppiness] = useState<SloppinessUi>('sketchy');
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
    if (fill?.type === 'shared') {
      const fillValue = fill.value;
      if (
        fillValue === 'none' ||
        fillValue === 'semi' ||
        fillValue === 'solid' ||
        fillValue === 'pattern'
      ) {
        setFillStyle(fillValue);
      }
    }

    const dash = editor.getSharedStyles().get(DefaultDashStyle);
    if (dash?.type === 'shared') {
      if (dash.value === 'draw') {
        setSloppiness('sketchy');
      } else {
        setSloppiness('straight');
        if (dash.value === 'solid' || dash.value === 'dashed' || dash.value === 'dotted') {
          setStrokeStyle(dash.value);
        }
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
    setFillStyle(value);
    applyStyle(editor, DefaultFillStyle, value);
  };

  const handleSloppinessChange = (value: SloppinessUi) => {
    setSloppiness(value);
    if (value === 'sketchy') {
      applyStyle(editor, DefaultDashStyle, 'draw');
      return;
    }
    applyStyle(editor, DefaultDashStyle, strokeStyle);
  };

  const handleStrokeStyleChange = (value: TLDefaultDashStyle) => {
    setStrokeStyle(value as StrokeUiStyle);
    if (sloppiness === 'straight') {
      applyStyle(editor, DefaultDashStyle, value);
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

  return (
    <div className="bg-[#1e1e1e] border border-white/10 rounded-xl p-5 shadow-2xl">
      <h3 className="text-sm font-semibold text-white mb-4 font-mono tracking-wide">
        ELEMENT PROPERTIES
      </h3>

      <div className="space-y-5">
        <ObjectIdSection label={objectIdLabel} />

        <ColorPickerSection
          activeColorHex={activeColorHex}
          onColorSelect={handleColorSelect}
          onCustomColorHex={setActiveColorHex}
        />

        <FillStyleSection value={fillStyle} onChange={handleFillChange} />

        <SloppinessSection value={sloppiness} onChange={handleSloppinessChange} />

        <StrokeStyleSection
          value={strokeStyle}
          disabled={sloppiness === 'sketchy'}
          onChange={handleStrokeStyleChange}
        />

        <StrokeWidthSection value={strokeWidth} onChange={handleStrokeWidthChange} />

        <OpacitySection value={opacity} onChange={handleOpacityChange} />
      </div>
    </div>
  );
}

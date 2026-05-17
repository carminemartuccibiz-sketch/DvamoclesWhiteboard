import { Plus } from 'lucide-react';
import type { TLDefaultColorStyle } from 'tldraw';
import { ColorPickerPopover } from '../../ColorPickerPopover';
import { sectionLabelClass } from '../sectionStyles';

const PRIMARY_COLORS: {
  uiHex: string;
  tldraw: TLDefaultColorStyle;
  label: string;
}[] = [
  { uiHex: '#000000', tldraw: 'black', label: 'Black' },
  { uiHex: '#FFFFFF', tldraw: 'white', label: 'White' },
  { uiHex: '#FF4D4D', tldraw: 'red', label: 'Red' },
  { uiHex: '#2F80ED', tldraw: 'blue', label: 'Blue' },
];

export const UI_HEX_BY_TLDRAW_COLOR = Object.fromEntries(
  PRIMARY_COLORS.map((c) => [c.tldraw, c.uiHex]),
) as Record<TLDefaultColorStyle, string>;

interface ColorPickerSectionProps {
  activeColorHex: string;
  onColorSelect: (color: TLDefaultColorStyle) => void;
  onCustomColorHex: (hex: string) => void;
}

export function ColorPickerSection({
  activeColorHex,
  onColorSelect,
  onCustomColorHex,
}: ColorPickerSectionProps) {
  return (
    <div>
      <label className={sectionLabelClass}>COLOR PALETTE</label>
      <div className="grid grid-cols-5 gap-2">
        {PRIMARY_COLORS.map((color) => (
          <button
            key={color.tldraw}
            type="button"
            onClick={() => onColorSelect(color.tldraw)}
            className={`
              w-full aspect-square rounded-lg transition-all duration-200
              ${
                activeColorHex === color.uiHex
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e] scale-95'
                  : 'hover:scale-105'
              }
              ${color.uiHex === '#FFFFFF' ? 'border-2 border-gray-600' : ''}
            `}
            style={{ backgroundColor: color.uiHex }}
            title={color.label}
          />
        ))}

        <ColorPickerPopover color={activeColorHex} onColorChange={onCustomColorHex}>
          <button
            type="button"
            className="w-full aspect-square rounded-lg border-2 border-white/20 hover:border-white/40 bg-transparent flex items-center justify-center transition-all duration-200 hover:bg-white/5"
            title="Add Custom Color"
          >
            <Plus size={20} className="text-white/60" strokeWidth={2.5} />
          </button>
        </ColorPickerPopover>
      </div>
    </div>
  );
}

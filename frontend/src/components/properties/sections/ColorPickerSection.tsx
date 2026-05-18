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
      <label className={sectionLabelClass}>Color</label>
      <div className="grid grid-cols-5 gap-2">
        {PRIMARY_COLORS.map((color) => (
          <button
            key={color.tldraw}
            type="button"
            onClick={() => onColorSelect(color.tldraw)}
            className={`
              w-full aspect-square rounded-xl transition-all duration-200
              ${
                activeColorHex === color.uiHex
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-95 shadow-lg'
                  : 'hover:scale-105 hover:ring-1 hover:ring-white/20'
              }
              ${color.uiHex === '#FFFFFF' ? 'border border-zinc-600' : ''}
            `}
            style={{ backgroundColor: color.uiHex }}
            title={color.label}
          />
        ))}

        <ColorPickerPopover color={activeColorHex} onColorChange={onCustomColorHex}>
          <button
            type="button"
            className="w-full aspect-square rounded-xl border border-dashed border-white/20 hover:border-white/35 bg-white/[0.02] flex items-center justify-center transition-all duration-200 hover:bg-white/[0.05]"
            title="Custom color"
          >
            <Plus size={18} className="text-zinc-500" strokeWidth={2.5} />
          </button>
        </ColorPickerPopover>
      </div>
    </div>
  );
}

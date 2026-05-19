import { Plus } from 'lucide-react';
import type { DvColorStyle } from '../../../contracts/styles';
import { ColorPickerPopover } from '../../ColorPickerPopover';
import { sectionLabelClass } from '../sectionStyles';
import { PRIMARY_COLORS, UI_HEX_BY_COLOR } from '../enginePalette';

interface ColorPickerSectionProps {
  activeColor: DvColorStyle;
  onColorSelect: (color: DvColorStyle) => void;
}

export function ColorPickerSection({ activeColor, onColorSelect }: ColorPickerSectionProps) {
  return (
    <div>
      <label className={sectionLabelClass}>Color</label>
      <div className="grid grid-cols-5 gap-2">
        {PRIMARY_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            onClick={() => onColorSelect(color.id)}
            className={`
              w-full aspect-square rounded-xl transition-all duration-200
              ${
                activeColor === color.id
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-95 shadow-lg'
                  : 'hover:scale-105 hover:ring-1 hover:ring-white/20'
              }
            `}
            style={{ backgroundColor: color.uiHex }}
            title={color.label}
          />
        ))}

        <ColorPickerPopover activeColor={activeColor} onColorSelect={onColorSelect}>
          <button
            type="button"
            className="w-full aspect-square rounded-xl border border-dashed border-white/20 hover:border-white/35 bg-white/[0.02] flex items-center justify-center transition-all duration-200 hover:bg-white/[0.05]"
            title="More colors"
          >
            <Plus size={18} className="text-zinc-500" strokeWidth={2.5} />
          </button>
        </ColorPickerPopover>
      </div>
      <span className="sr-only">Selected: {UI_HEX_BY_COLOR[activeColor] ?? activeColor}</span>
    </div>
  );
}

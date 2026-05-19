import * as Popover from '@radix-ui/react-popover';
import type { DvColorStyle } from '../contracts/styles';
import { EXTENDED_COLORS } from './properties/enginePalette';

interface ColorPickerPopoverProps {
  activeColor: DvColorStyle;
  onColorSelect: (color: DvColorStyle) => void;
  children: React.ReactNode;
}

export function ColorPickerPopover({
  activeColor,
  onColorSelect,
  children,
}: ColorPickerPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="w-[220px] bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl z-[200]"
          sideOffset={12}
          side="right"
          align="start"
        >
          <label className="text-xs text-white/50 mb-3 block font-ui font-medium">
            Palette
          </label>
          <div className="grid grid-cols-4 gap-2">
            {EXTENDED_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => onColorSelect(color.id)}
                className={`
                  aspect-square rounded-lg transition-all duration-200 border-2
                  ${
                    activeColor === color.id
                      ? 'border-white scale-95 ring-1 ring-white/30'
                      : 'border-transparent hover:border-white/25 hover:scale-105'
                  }
                `}
                style={{ backgroundColor: color.uiHex }}
                title={color.label}
              />
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

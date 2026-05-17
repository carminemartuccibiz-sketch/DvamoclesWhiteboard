import { useState, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Pipette } from 'lucide-react';

interface ColorPickerPopoverProps {
  color: string;
  onColorChange: (color: string) => void;
  children: React.ReactNode;
}

export function ColorPickerPopover({ color, onColorChange, children }: ColorPickerPopoverProps) {
  const [rgba, setRgba] = useState({ r: 0, g: 0, b: 0, a: 100 });
  const [hexInput, setHexInput] = useState('#000000');

  // Sync with external color prop
  useEffect(() => {
    setHexInput(color);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    setRgba({ r, g, b, a: 100 });
  }, [color]);

  const extraColors = [
    '#F1F5F9', // Slate
    '#E0E7FF', // Indigo
    '#DDD6FE', // Violet
    '#FCE7F3', // Pink
    '#FED7AA', // Orange
    '#FEF08A', // Yellow
    '#BBF7D0', // Green
    '#A5F3FC', // Cyan
  ];

  const handleRgbaChange = (channel: 'r' | 'g' | 'b' | 'a', value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = channel === 'a'
      ? Math.max(0, Math.min(100, numValue))
      : Math.max(0, Math.min(255, numValue));

    const newRgba = { ...rgba, [channel]: clampedValue };
    setRgba(newRgba);

    const hex = `#${newRgba.r.toString(16).padStart(2, '0').toUpperCase()}${newRgba.g.toString(16).padStart(2, '0').toUpperCase()}${newRgba.b.toString(16).padStart(2, '0').toUpperCase()}`;
    setHexInput(hex);
    onColorChange(hex);
  };

  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      const r = parseInt(value.slice(1, 3), 16);
      const g = parseInt(value.slice(3, 5), 16);
      const b = parseInt(value.slice(5, 7), 16);
      setRgba({ ...rgba, r, g, b });
      onColorChange(value.toUpperCase());
    }
  };

  const handleColorSelect = (selectedColor: string) => {
    setHexInput(selectedColor);
    onColorChange(selectedColor);

    const r = parseInt(selectedColor.slice(1, 3), 16);
    const g = parseInt(selectedColor.slice(3, 5), 16);
    const b = parseInt(selectedColor.slice(5, 7), 16);
    setRgba({ ...rgba, r, g, b });
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        {children}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="w-[300px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl"
          sideOffset={12}
          side="right"
          align="start"
        >
          {/* Extra Colors */}
          <div className="mb-5">
            <label className="text-xs text-gray-400 mb-3 block font-medium">Extra Colors</label>
            <div className="grid grid-cols-4 gap-2.5">
              {extraColors.map((extraColor) => (
                <button
                  key={extraColor}
                  onClick={() => handleColorSelect(extraColor)}
                  className={`
                    h-12 rounded-lg transition-all duration-200 border-2
                    ${color.toUpperCase() === extraColor.toUpperCase()
                      ? 'border-white scale-95'
                      : 'border-white/20 hover:border-white/40 hover:scale-105'
                    }
                  `}
                  style={{ backgroundColor: extraColor }}
                />
              ))}
            </div>
          </div>

          {/* RGBA Inputs */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 mb-3 block font-medium">RGBA Values</label>
            <div className="grid grid-cols-4 gap-2.5">
              {(['r', 'g', 'b', 'a'] as const).map((channel) => (
                <div key={channel}>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1.5 font-medium">
                    {channel}
                  </label>
                  <input
                    type="number"
                    value={rgba[channel]}
                    onChange={(e) => handleRgbaChange(channel, e.target.value)}
                    min={0}
                    max={channel === 'a' ? 100 : 255}
                    className="w-full px-2.5 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Hex Input & Eyedropper */}
          <div>
            <label className="text-xs text-gray-400 mb-3 block font-medium">Hex Code</label>
            <div className="flex gap-2.5">
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 px-3.5 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 flex items-center justify-center flex-shrink-0"
                title="Eyedropper Tool"
              >
                <Pipette size={18} />
              </button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

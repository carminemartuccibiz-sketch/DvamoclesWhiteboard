import { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { Plus } from 'lucide-react';
import { ColorPickerPopover } from './ColorPickerPopover';

export function PropertiesPanel() {
  const [objectId, setObjectId] = useState('object_12345');
  const [activeColor, setActiveColor] = useState('#000000');
  const [fillStyle, setFillStyle] = useState('solid');
  const [strokeWidth, setStrokeWidth] = useState('medium');
  const [opacity, setOpacity] = useState([100]);

  const primaryColors = [
    { value: '#000000', label: 'Nero (Pure Black)' },
    { value: '#FFFFFF', label: 'Bianco (Pure White)' },
    { value: '#FF4D4D', label: 'Rosso (Vibrant Red)' },
    { value: '#2F80ED', label: 'Blu (Deep Blue)' },
  ];

  return (
    <div className="bg-[#1e1e1e] border border-white/10 rounded-xl p-5 shadow-2xl">
      <h3 className="text-sm font-semibold text-white mb-4 font-mono tracking-wide">ELEMENT PROPERTIES</h3>

      <div className="space-y-5">
        {/* Object ID */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block font-medium">OBJECT ID</label>
          <input
            type="text"
            value={objectId}
            onChange={(e) => setObjectId(e.target.value)}
            className="w-full px-3 py-2.5 bg-white/5 border-2 border-blue-500/50 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Color Palette - Perfectly Aligned 5 Boxes */}
        <div>
          <label className="text-xs text-gray-400 mb-3 block font-medium">COLOR PALETTE</label>
          <div className="grid grid-cols-5 gap-2">
            {primaryColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setActiveColor(color.value)}
                className={`
                  w-full aspect-square rounded-lg transition-all duration-200
                  ${activeColor === color.value
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e] scale-95'
                    : 'hover:scale-105'
                  }
                  ${color.value === '#FFFFFF' ? 'border-2 border-gray-600' : ''}
                `}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}

            {/* Add Color Button - 5th Box, Perfectly Aligned */}
            <ColorPickerPopover color={activeColor} onColorChange={setActiveColor}>
              <button
                className="w-full aspect-square rounded-lg border-2 border-white/20 hover:border-white/40 bg-transparent flex items-center justify-center transition-all duration-200 hover:bg-white/5"
                title="Add Custom Color"
              >
                <Plus size={20} className="text-white/60" strokeWidth={2.5} />
              </button>
            </ColorPickerPopover>
          </div>
        </div>

        {/* Fill Style - Text Only, No Icons */}
        <div>
          <label className="text-xs text-gray-400 mb-3 block font-medium">FILL STYLE</label>
          <ToggleGroup.Root
            type="single"
            value={fillStyle}
            onValueChange={(value) => value && setFillStyle(value)}
            className="grid grid-cols-3 gap-0 bg-white/5 rounded-lg p-1 border border-white/10"
          >
            <ToggleGroup.Item
              value="none"
              className="px-3 py-2.5 text-sm font-medium rounded-md text-gray-300 hover:text-white data-[state=on]:bg-white/20 data-[state=on]:text-white transition-all duration-200"
            >
              None
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="solid"
              className="px-3 py-2.5 text-sm font-medium rounded-md text-gray-300 hover:text-white data-[state=on]:bg-white/20 data-[state=on]:text-white transition-all duration-200"
            >
              Solid
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="sketch"
              className="px-3 py-2.5 text-sm font-medium rounded-md text-gray-300 hover:text-white data-[state=on]:bg-white/20 data-[state=on]:text-white transition-all duration-200"
            >
              Sketch
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        </div>

        {/* Stroke Width */}
        <div>
          <label className="text-xs text-gray-400 mb-3 block font-medium">STROKE WIDTH</label>
          <ToggleGroup.Root
            type="single"
            value={strokeWidth}
            onValueChange={(value) => value && setStrokeWidth(value)}
            className="grid grid-cols-3 gap-0 bg-white/5 rounded-lg p-1 border border-white/10"
          >
            <ToggleGroup.Item
              value="thin"
              className="px-3 py-2.5 text-sm font-medium rounded-md text-gray-300 hover:text-white data-[state=on]:bg-white/20 data-[state=on]:text-white transition-all duration-200"
            >
              Thin
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="medium"
              className="px-3 py-2.5 text-sm font-medium rounded-md text-gray-300 hover:text-white data-[state=on]:bg-white/20 data-[state=on]:text-white transition-all duration-200"
            >
              Medium
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="thick"
              className="px-3 py-2.5 text-sm font-medium rounded-md text-gray-300 hover:text-white data-[state=on]:bg-white/20 data-[state=on]:text-white transition-all duration-200"
            >
              Thick
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        </div>

        {/* Opacity */}
        <div>
          <label className="text-xs text-gray-400 mb-3 block font-medium">
            OPACITY <span className="text-white ml-1">{opacity[0]}%</span>
          </label>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={opacity}
            onValueChange={setOpacity}
            max={100}
            step={1}
          >
            <Slider.Track className="bg-white/10 relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-white rounded-full shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Opacity"
            />
          </Slider.Root>
        </div>
      </div>
    </div>
  );
}

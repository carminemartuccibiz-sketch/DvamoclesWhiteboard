import * as Slider from '@radix-ui/react-slider';
import { sectionLabelClass } from '../sectionStyles';

interface OpacitySectionProps {
  value: number[];
  onChange: (value: number[]) => void;
}

export function OpacitySection({ value, onChange }: OpacitySectionProps) {
  return (
    <div>
      <label className={sectionLabelClass}>
        OPACITY <span className="text-white ml-1">{value[0]}%</span>
      </label>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={value}
        onValueChange={onChange}
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
  );
}

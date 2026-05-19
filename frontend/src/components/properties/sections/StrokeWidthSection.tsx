import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { DvSizeStyle } from '../../../contracts/styles';
import { sectionLabelClass, toggleGroupClass, toggleItemClass } from '../sectionStyles';

export type SizeUi = DvSizeStyle;

const SIZE_OPTIONS: { value: SizeUi; label: string }[] = [
  { value: 's', label: 'S' },
  { value: 'm', label: 'M' },
  { value: 'l', label: 'L' },
  { value: 'xl', label: 'XL' },
];

interface StrokeWidthSectionProps {
  value: SizeUi;
  onChange: (value: DvSizeStyle) => void;
}

export function StrokeWidthSection({ value, onChange }: StrokeWidthSectionProps) {
  return (
    <div>
      <label className={sectionLabelClass}>Width</label>
      <ToggleGroup.Root
        type="single"
        value={value}
        onValueChange={(next) => next && onChange(next as DvSizeStyle)}
        className={toggleGroupClass}
      >
        {SIZE_OPTIONS.map((opt) => (
          <ToggleGroup.Item key={opt.value} value={opt.value} className={toggleItemClass}>
            {opt.label}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}

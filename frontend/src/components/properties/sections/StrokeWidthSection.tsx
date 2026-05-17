import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { TLDefaultSizeStyle } from 'tldraw';
import { sectionLabelClass, toggleGroupClass, toggleItemClass } from '../sectionStyles';

export type SizeUi = 's' | 'm' | 'l' | 'xl';

const SIZE_OPTIONS: { value: SizeUi; label: string }[] = [
  { value: 's', label: 'S' },
  { value: 'm', label: 'M' },
  { value: 'l', label: 'L' },
  { value: 'xl', label: 'XL' },
];

interface StrokeWidthSectionProps {
  value: SizeUi;
  onChange: (value: TLDefaultSizeStyle) => void;
}

export function StrokeWidthSection({ value, onChange }: StrokeWidthSectionProps) {
  return (
    <div>
      <label className={sectionLabelClass}>STROKE WIDTH</label>
      <ToggleGroup.Root
        type="single"
        value={value}
        onValueChange={(next) => next && onChange(next as TLDefaultSizeStyle)}
        className={`${toggleGroupClass} grid-cols-4`}
      >
        {SIZE_OPTIONS.map((option) => (
          <ToggleGroup.Item
            key={option.value}
            value={option.value}
            className={toggleItemClass}
          >
            {option.label}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}

import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { TLDefaultDashStyle } from 'tldraw';
import { sectionLabelClass, toggleGroupClass, toggleItemClass } from '../sectionStyles';

export type StrokeUiStyle = 'solid' | 'dashed' | 'dotted';

const STROKE_OPTIONS: { value: StrokeUiStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
];

interface StrokeStyleSectionProps {
  value: StrokeUiStyle;
  disabled: boolean;
  onChange: (value: TLDefaultDashStyle) => void;
}

export function StrokeStyleSection({
  value,
  disabled,
  onChange,
}: StrokeStyleSectionProps) {
  return (
    <div>
      <label className={sectionLabelClass}>STROKE STYLE</label>
      <ToggleGroup.Root
        type="single"
        value={value}
        disabled={disabled}
        onValueChange={(next) => next && onChange(next as TLDefaultDashStyle)}
        className={`${toggleGroupClass} grid-cols-3 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      >
        {STROKE_OPTIONS.map((option) => (
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

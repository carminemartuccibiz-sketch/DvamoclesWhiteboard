import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { cn } from '../../ui/utils';
import { sectionLabelClass, toggleGroupClass, toggleItemClass } from '../sectionStyles';

export type StrokeUiStyle = 'solid' | 'dashed' | 'dotted';

const STROKE_OPTIONS: { value: StrokeUiStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
];

interface StrokeStyleSectionProps {
  value: StrokeUiStyle;
  disabled?: boolean;
  onChange: (value: StrokeUiStyle) => void;
}

export function StrokeStyleSection({ value, disabled, onChange }: StrokeStyleSectionProps) {
  return (
    <div>
      <label className={sectionLabelClass}>Stroke</label>
      <ToggleGroup.Root
        type="single"
        value={value}
        disabled={disabled}
        onValueChange={(next) => next && onChange(next as StrokeUiStyle)}
        className={cn(toggleGroupClass, disabled && 'opacity-50 pointer-events-none')}
      >
        {STROKE_OPTIONS.map((opt) => (
          <ToggleGroup.Item key={opt.value} value={opt.value} className={toggleItemClass}>
            {opt.label}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}

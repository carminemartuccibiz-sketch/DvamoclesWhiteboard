import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { TLDefaultFillStyle } from 'tldraw';
import { cn } from '../../ui/utils';
import { sectionLabelClass, toggleGroupClass, toggleItemClass } from '../sectionStyles';

export type FillUiStyle = 'none' | 'semi' | 'solid' | 'pattern';

const FILL_OPTIONS: { value: FillUiStyle; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'semi', label: 'Semi' },
  { value: 'solid', label: 'Solid' },
  { value: 'pattern', label: 'Pattern' },
];

interface FillStyleSectionProps {
  value: FillUiStyle;
  disabled?: boolean;
  onChange: (value: TLDefaultFillStyle) => void;
}

export function FillStyleSection({ value, disabled, onChange }: FillStyleSectionProps) {
  return (
    <div>
      <label className={sectionLabelClass}>Fill</label>
      <ToggleGroup.Root
        type="single"
        value={value}
        disabled={disabled}
        onValueChange={(next) => next && onChange(next as TLDefaultFillStyle)}
        className={cn(
          `${toggleGroupClass} grid-cols-4`,
          disabled && 'opacity-40 pointer-events-none',
        )}
      >
        {FILL_OPTIONS.map((option) => (
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

import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { DvFillStyle } from '../../../contracts/styles';
import { cn } from '../../ui/utils';
import { sectionLabelClass, toggleGroupClass, toggleItemClass } from '../sectionStyles';

export type FillUiStyle = DvFillStyle;

const FILL_OPTIONS: { value: FillUiStyle; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'semi', label: 'Semi' },
  { value: 'solid', label: 'Solid' },
  { value: 'pattern', label: 'Pattern' },
];

interface FillStyleSectionProps {
  value: FillUiStyle;
  disabled?: boolean;
  onChange: (value: DvFillStyle) => void;
}

export function FillStyleSection({ value, disabled, onChange }: FillStyleSectionProps) {
  return (
    <div>
      <label className={sectionLabelClass}>Fill</label>
      <ToggleGroup.Root
        type="single"
        value={value}
        disabled={disabled}
        onValueChange={(next) => next && onChange(next as DvFillStyle)}
        className={cn(
          toggleGroupClass,
          disabled && 'opacity-50 pointer-events-none',
        )}
      >
        {FILL_OPTIONS.map((opt) => (
          <ToggleGroup.Item key={opt.value} value={opt.value} className={toggleItemClass}>
            {opt.label}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );
}

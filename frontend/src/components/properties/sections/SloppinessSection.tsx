import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { sectionLabelClass, toggleGroupClass, toggleItemClass } from '../sectionStyles';

export type SloppinessUi = 'straight' | 'sketchy';

interface SloppinessSectionProps {
  value: SloppinessUi;
  onChange: (value: SloppinessUi) => void;
}

export function SloppinessSection({ value, onChange }: SloppinessSectionProps) {
  return (
    <div>
      <label className={sectionLabelClass}>SLOPPINESS</label>
      <ToggleGroup.Root
        type="single"
        value={value}
        onValueChange={(next) => next && onChange(next as SloppinessUi)}
        className={`${toggleGroupClass} grid-cols-2`}
      >
        <ToggleGroup.Item value="straight" className={toggleItemClass}>
          Straight
        </ToggleGroup.Item>
        <ToggleGroup.Item value="sketchy" className={toggleItemClass}>
          Sketchy
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>
  );
}

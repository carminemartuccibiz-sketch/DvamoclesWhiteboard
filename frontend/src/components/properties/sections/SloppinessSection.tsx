import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { Pencil, Ruler } from 'lucide-react';
import { sectionLabelClass, toggleGroupClass, toggleItemClass } from '../sectionStyles';
import { cn } from '../../ui/utils';

export type SloppinessUi = 'straight' | 'sketchy';

interface SloppinessSectionProps {
  value: SloppinessUi;
  onChange: (value: SloppinessUi) => void;
}

export function SloppinessSection({ value, onChange }: SloppinessSectionProps) {
  return (
    <div>
      <label className={sectionLabelClass}>Sloppiness</label>
      <ToggleGroup.Root
        type="single"
        value={value}
        onValueChange={(next) => next && onChange(next as SloppinessUi)}
        className={cn(toggleGroupClass, 'grid-cols-2')}
      >
        <ToggleGroup.Item value="straight" className={cn(toggleItemClass, 'flex items-center justify-center gap-1.5')}>
          <Ruler size={13} />
          Straight
        </ToggleGroup.Item>
        <ToggleGroup.Item value="sketchy" className={cn(toggleItemClass, 'flex items-center justify-center gap-1.5')}>
          <Pencil size={13} />
          Sketchy
        </ToggleGroup.Item>
      </ToggleGroup.Root>
    </div>
  );
}

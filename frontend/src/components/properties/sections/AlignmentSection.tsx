import {
  AlignCenter,
  AlignHorizontalDistributeCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalDistributeCenter,
} from 'lucide-react';
import { useState } from 'react';
import { PropertyCard } from '../../ui/panel';

const alignBtn =
  'flex-1 flex items-center justify-center p-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95';

/** Shown when multi-select is wired in Phase 3 */
export function AlignmentSection() {
  const [selectedCount] = useState(0);

  if (selectedCount < 2) return null;

  return (
    <PropertyCard title="Align & Distribute">
      <div className="flex flex-col gap-3">
        <div>
          <span className="text-white/50 text-xs font-ui block mb-2">Align</span>
          <div className="flex gap-1.5">
            <button type="button" className={alignBtn} aria-label="Align left">
              <AlignLeft className="w-4 h-4" />
            </button>
            <button type="button" className={alignBtn} aria-label="Align center">
              <AlignCenter className="w-4 h-4" />
            </button>
            <button type="button" className={alignBtn} aria-label="Align right">
              <AlignRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div>
          <span className="text-white/50 text-xs font-ui block mb-2">Distribute</span>
          <div className="flex gap-1.5">
            <button type="button" className={alignBtn} aria-label="Distribute horizontally">
              <AlignHorizontalDistributeCenter className="w-4 h-4" />
            </button>
            <button type="button" className={alignBtn} aria-label="Distribute vertically">
              <AlignVerticalDistributeCenter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </PropertyCard>
  );
}

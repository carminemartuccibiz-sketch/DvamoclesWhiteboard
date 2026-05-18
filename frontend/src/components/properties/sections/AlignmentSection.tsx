import {
  AlignCenter,
  AlignHorizontalDistributeCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalDistributeCenter,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useEditor } from 'tldraw';
import { PropertyCard } from '../../ui/panel';
import { cn } from '../../ui/utils';

const alignBtn =
  'flex-1 flex items-center justify-center p-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95';

export function AlignmentSection() {
  const editor = useEditor();
  const [selectedCount, setSelectedCount] = useState(0);

  const syncSelection = useCallback(() => {
    setSelectedCount(editor.getSelectedShapeIds().length);
  }, [editor]);

  useEffect(() => {
    syncSelection();
    const unlisten = editor.store.listen(syncSelection);
    return () => unlisten();
  }, [editor, syncSelection]);

  if (selectedCount < 2) return null;

  const ids = editor.getSelectedShapeIds();

  return (
    <PropertyCard title="Align & Distribute">
      <div className="flex flex-col gap-3">
        <div>
          <span className="text-white/50 text-xs font-ui block mb-2">Align</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              className={alignBtn}
              aria-label="Align left"
              onClick={() => editor.alignShapes(ids, 'left')}
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={alignBtn}
              aria-label="Align center"
              onClick={() => editor.alignShapes(ids, 'center-horizontal')}
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={cn(alignBtn)}
              aria-label="Align right"
              onClick={() => editor.alignShapes(ids, 'right')}
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div>
          <span className="text-white/50 text-xs font-ui block mb-2">Distribute</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              className={alignBtn}
              aria-label="Distribute horizontally"
              onClick={() => editor.distributeShapes(ids, 'horizontal')}
            >
              <AlignHorizontalDistributeCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={alignBtn}
              aria-label="Distribute vertically"
              onClick={() => editor.distributeShapes(ids, 'vertical')}
            >
              <AlignVerticalDistributeCenter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </PropertyCard>
  );
}

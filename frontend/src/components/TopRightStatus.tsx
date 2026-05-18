import { useCallback, useEffect, useState } from 'react';
import { Plus, Minus, Sun, Moon } from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';
import { useEditor } from 'tldraw';
import { chrome } from './ui/chrome';

interface TopRightStatusProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function TopRightStatus({ isDarkMode, onToggleDarkMode }: TopRightStatusProps) {
  const editor = useEditor();
  const [zoom, setZoom] = useState(100);

  const syncZoom = useCallback(() => {
    setZoom(Math.round(editor.getCamera().z * 100));
  }, [editor]);

  useEffect(() => {
    syncZoom();
    const unlisten = editor.store.listen(syncZoom);
    return () => unlisten();
  }, [editor, syncZoom]);

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
      <div className={`flex items-center gap-3 px-4 py-2.5 ${chrome.topChip}`}>
        <Sun
          size={17}
          className={`transition-colors duration-300 ${isDarkMode ? 'text-zinc-600' : 'text-amber-400'}`}
        />
        <Switch.Root
          checked={isDarkMode}
          onCheckedChange={onToggleDarkMode}
          className="w-11 h-6 bg-zinc-800 rounded-full relative border border-white/[0.08] data-[state=checked]:bg-zinc-700 transition-colors duration-300"
        >
          <Switch.Thumb className="block w-[18px] h-[18px] bg-white rounded-full shadow-md transition-transform duration-300 translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
        </Switch.Root>
        <Moon
          size={17}
          className={`transition-colors duration-300 ${isDarkMode ? 'text-blue-400' : 'text-zinc-600'}`}
        />
      </div>

      <div className={`flex items-center gap-1 px-3 py-2 ${chrome.topChip}`}>
        <button
          type="button"
          onClick={() => editor.zoomOut()}
          className={chrome.iconBtn}
          aria-label="Zoom out"
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>
        <span className="text-xs font-mono text-zinc-200 min-w-[48px] text-center tabular-nums font-medium">
          {zoom}%
        </span>
        <button
          type="button"
          onClick={() => editor.zoomIn()}
          className={chrome.iconBtn}
          aria-label="Zoom in"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

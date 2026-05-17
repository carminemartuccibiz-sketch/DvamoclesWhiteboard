import { Plus, Minus, Sun, Moon } from 'lucide-react';
import * as Switch from '@radix-ui/react-switch';

interface TopRightStatusProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function TopRightStatus({
  zoom,
  onZoomIn,
  onZoomOut,
  isDarkMode,
  onToggleDarkMode
}: TopRightStatusProps) {
  return (
    <div className="fixed top-8 right-8 z-50 flex items-center gap-4">
      {/* Light/Dark Mode Toggle */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
        <Sun size={18} className={`transition-colors duration-200 ${isDarkMode ? 'text-gray-600' : 'text-yellow-400'}`} />
        <Switch.Root
          checked={isDarkMode}
          onCheckedChange={onToggleDarkMode}
          className="w-12 h-6 bg-white/20 rounded-full relative data-[state=checked]:bg-gray-700 data-[state=unchecked]:bg-blue-400 transition-colors duration-200"
        >
          <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-200 translate-x-0.5 data-[state=checked]:translate-x-[26px] shadow-lg" />
        </Switch.Root>
        <Moon size={18} className={`transition-colors duration-200 ${isDarkMode ? 'text-blue-400' : 'text-gray-600'}`} />
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
          aria-label="Zoom out"
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>
        <span className="text-sm font-mono text-white min-w-[52px] text-center font-medium">
          {zoom}%
        </span>
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
          aria-label="Zoom in"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

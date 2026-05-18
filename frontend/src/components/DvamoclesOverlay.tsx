import { SettingsModal } from './SettingsModal';
import { TopBar } from './TopBar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { BottomToolbar } from './BottomToolbar';

interface DvamoclesOverlayProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  settingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
}

export function DvamoclesOverlay({
  isDarkMode,
  onToggleDarkMode,
  settingsOpen,
  onSettingsOpenChange,
}: DvamoclesOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col p-4 sm:p-5 gap-3 min-h-0">
      <header className="pointer-events-auto shrink-0">
        <TopBar
          isDarkMode={isDarkMode}
          onToggleDarkMode={onToggleDarkMode}
          onOpenSettings={() => onSettingsOpenChange(true)}
        />
      </header>

      <div className="flex-1 flex min-h-0 gap-3 sm:gap-4 items-stretch">
        <div className="pointer-events-auto flex min-h-0 self-start max-h-full">
          <LeftSidebar />
        </div>

        <div className="flex-1 min-w-0" aria-hidden />

        <div className="pointer-events-auto flex min-h-0 self-start max-h-full ml-auto">
          <RightSidebar />
        </div>
      </div>

      <footer className="pointer-events-none flex justify-center shrink-0 pt-1">
        <BottomToolbar />
      </footer>

      <div className="pointer-events-auto">
        <SettingsModal open={settingsOpen} onOpenChange={onSettingsOpenChange} />
      </div>
    </div>
  );
}

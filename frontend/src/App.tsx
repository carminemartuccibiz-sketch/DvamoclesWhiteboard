import { useState } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

import { TopBar } from './components/TopBar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { BottomToolbar } from './components/BottomToolbar';
import { SettingsModal } from './components/SettingsModal';
import { CanvasMinimap } from './components/ui/CanvasMinimap';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className={isDarkMode ? 'dark font-ui' : 'font-ui'}>
      <div className="relative w-screen h-screen overflow-hidden bg-[#030306] text-white antialiased">
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 90% 60% at 50% -30%, rgba(59, 130, 246, 0.12), transparent 55%),
              radial-gradient(ellipse 50% 40% at 100% 80%, rgba(139, 92, 246, 0.07), transparent 50%),
              radial-gradient(ellipse 40% 30% at 0% 60%, rgba(14, 165, 233, 0.05), transparent 45%)
            `,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <Tldraw
          hideUi
          colorScheme={isDarkMode ? 'dark' : 'light'}
          className="absolute inset-0 z-0"
        >
          {/* Modular chrome — flex shell; panels float over canvas without fixed overlap */}
          <div className="absolute inset-0 z-10 flex flex-col p-4 sm:p-5 gap-3 min-h-0 pointer-events-none">
            <header className="shrink-0 flex justify-center pointer-events-auto">
              <TopBar
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode((v) => !v)}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            </header>

            <div className="flex-1 flex min-h-0 gap-3 sm:gap-4 overflow-hidden">
              <aside className="shrink-0 self-start min-h-0 max-h-[calc(100vh-140px)] pointer-events-auto">
                <LeftSidebar />
              </aside>

              <div className="flex-1 min-w-0" aria-hidden />

              <aside className="shrink-0 self-start min-h-0 max-h-[calc(100vh-140px)] ml-auto pointer-events-auto">
                <RightSidebar />
              </aside>
            </div>

            <footer className="shrink-0 flex items-end justify-between gap-4 pointer-events-none">
              <div className="flex-1 flex justify-center min-w-0 pointer-events-auto">
                <BottomToolbar />
              </div>
              <div className="shrink-0 pointer-events-auto max-sm:hidden">
                <CanvasMinimap />
              </div>
            </footer>
          </div>

          <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
        </Tldraw>
      </div>
    </div>
  );
}

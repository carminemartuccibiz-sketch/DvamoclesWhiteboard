import { useState } from 'react';

import { SpatialCanvas } from './components/canvas/SpatialCanvas';
import { TopBar } from './components/TopBar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { BottomToolbar } from './components/BottomToolbar';
import { SettingsModal } from './components/SettingsModal';
import { CanvasMinimap } from './components/ui/CanvasMinimap';
import { EngineProvider, useEngine } from './engine/EngineContext';

function AppChrome() {
  const engine = useEngine();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <SpatialCanvas />

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

      <div className="absolute inset-0 z-50 flex flex-col p-4 sm:p-5 gap-3 min-h-0 pointer-events-none">
        <header className="shrink-0 flex justify-center pointer-events-auto">
          <TopBar
            isDarkMode={engine.isDarkMode}
            onDarkModeChange={engine.setIsDarkMode}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </header>

        <ChromeSidebars />

        <footer className="shrink-0 flex items-end justify-between gap-4 pointer-events-none">
          <div className="flex-1 flex justify-center min-w-0 pointer-events-auto">
            <BottomToolbar />
          </div>
          <div className="shrink-0 pointer-events-auto max-sm:hidden">
            <CanvasMinimap />
          </div>
        </footer>
      </div>

      <div className="pointer-events-auto relative z-50">
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </>
  );
}

function ChromeSidebars() {
  return (
    <div className="flex-1 flex min-h-0 gap-3 sm:gap-4 overflow-visible">
      <aside className="shrink-0 self-start min-h-0 max-h-[calc(100vh-140px)] pointer-events-auto overflow-visible">
        <LeftSidebar />
      </aside>

      <div className="flex-1 min-w-0" aria-hidden />

      <aside className="shrink-0 self-start min-h-0 max-h-[calc(100vh-140px)] ml-auto pointer-events-auto overflow-visible">
        <RightSidebar />
      </aside>
    </div>
  );
}

function AppShell() {
  const engine = useEngine();

  return (
    <div className={engine.isDarkMode ? 'dark font-ui' : 'font-ui'}>
      <div
        className={
          engine.isDarkMode
            ? 'relative w-screen h-screen overflow-hidden bg-[#0A0A0A] text-white antialiased'
            : 'relative w-screen h-screen overflow-hidden bg-white text-zinc-900 antialiased'
        }
      >
        <AppChrome />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <EngineProvider>
      <AppShell />
    </EngineProvider>
  );
}

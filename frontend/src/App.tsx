import { useState } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

import { FloatingToolbar } from './components/FloatingToolbar';
import { TopLeftMenu } from './components/TopLeftMenu';
import { TopRightStatus } from './components/TopRightStatus';
import { ProjectNavigation } from './components/ProjectNavigation';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ImportAssets } from './components/ImportAssets';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className={isDarkMode ? 'dark font-ui' : 'font-ui'}>
      <div className="relative w-screen h-screen overflow-hidden bg-[#030306] text-white antialiased">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 90% 60% at 50% -30%, rgba(59, 130, 246, 0.12), transparent 55%),
              radial-gradient(ellipse 50% 40% at 100% 80%, rgba(139, 92, 246, 0.07), transparent 50%),
              radial-gradient(ellipse 40% 30% at 0% 60%, rgba(14, 165, 233, 0.05), transparent 45%)
            `,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
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
          <div className="absolute inset-0 z-10 pointer-events-none">
            <header className="pointer-events-auto">
              <TopLeftMenu onOpenSettings={() => setSettingsOpen(true)} />
              <TopRightStatus
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              />
            </header>

            <aside className="fixed left-5 top-[7rem] z-40 w-[19.5rem] max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar space-y-3 pointer-events-auto pr-1 dv-stagger">
              <ProjectNavigation />
              <PropertiesPanel />
              <ImportAssets />
            </aside>

            <footer className="pointer-events-auto">
              <FloatingToolbar />
            </footer>

            <div className="pointer-events-auto">
              <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
            </div>
          </div>
        </Tldraw>
      </div>
    </div>
  );
}

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
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="w-screen h-screen bg-[#0a0a0a] overflow-hidden relative text-white">
        <Tldraw
          hideUi
          colorScheme={isDarkMode ? 'dark' : 'light'}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <TopLeftMenu onOpenSettings={() => setSettingsOpen(true)} />
              <TopRightStatus
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              />
            </div>

            <div className="fixed left-8 top-32 z-40 w-80 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar space-y-4 pointer-events-auto">
              <ProjectNavigation />
              <PropertiesPanel />
              <ImportAssets />
            </div>

            <div className="pointer-events-auto">
              <FloatingToolbar />
            </div>

            <div className="pointer-events-auto">
              <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
            </div>
          </div>
        </Tldraw>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css'; // Carica gli stili grafici e strutturali unificati

// I tuoi componenti di Figma
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
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 25));

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="w-screen h-screen bg-[#0a0a0a] overflow-hidden relative text-white">
        
        {/* LAYER 0: Il Canvas interattivo reale (Interfaccia nativa nascosta) */}
        <div className="absolute inset-0 z-0">
          <Tldraw hideUi>
            {/* LAYER 1: L'interfaccia fluttuante viene inserita come FIGLIO di Tldraw */}
            {/* In questo modo l'hook useEditor() funzionerà ovunque nei menu */}
            <DvamoclesUiOverlay 
              zoom={zoom} 
              handleZoomIn={handleZoomIn} 
              handleZoomOut={handleZoomOut}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              settingsOpen={settingsOpen}
              setSettingsOpen={setSettingsOpen}
            />
          </Tldraw>
        </div>

      </div>
    </div>
  );
}

// Wrapper per l'interfaccia utente flottante
function DvamoclesUiOverlay({ 
  zoom, handleZoomIn, handleZoomOut, isDarkMode, setIsDarkMode, settingsOpen, setSettingsOpen 
}: any) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      
      {/* Header superiore */}
      <div className="pointer-events-auto">
        <TopLeftMenu onOpenSettings={() => setSettingsOpen(true)} />
        <TopRightStatus
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
      </div>

      {/* Sidebar Sinistra - Pannelli impilati */}
      <div className="fixed left-8 top-24 z-40 w-80 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar space-y-4 pointer-events-auto">
        <ProjectNavigation />
        <PropertiesPanel />
        <ImportAssets />
      </div>

      {/* Toolbar Inferiore */}
      <div className="pointer-events-auto">
        <FloatingToolbar />
      </div>

      {/* Finestra Impostazioni Modale */}
      <div className="pointer-events-auto">
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>

    </div>
  );
}
import { useState } from 'react';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import BottomToolbar from './components/BottomToolbar';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div
      className="size-full relative overflow-hidden"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      {/* Infinite Canvas Background Grid */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Navigation Bar */}
      <TopBar onSettingsClick={() => setSettingsOpen(true)} />

      {/* Left Sidebar - Schemas & Assets */}
      <LeftSidebar />

      {/* Right Sidebar - Modular Property Cards */}
      <RightSidebar />

      {/* Bottom Toolbar - Floating Tool Engine */}
      <BottomToolbar />

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Canvas Drawing Area (Transparent - Ready for Canvas Layer) */}
      <div className="absolute inset-0 pointer-events-none" />
    </div>
  );
}
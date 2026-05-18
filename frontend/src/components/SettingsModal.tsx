import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import * as Select from '@radix-ui/react-select';
import { X, Settings, Grid3x3, Keyboard, Info, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [autoSave, setAutoSave] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [exportFormat, setExportFormat] = useState('png');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'canvas', label: 'Canvas & Grid', icon: Grid3x3 },
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard },
    { id: 'about', label: 'About Dvamocles', icon: Info },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl z-50 flex overflow-hidden">
          {/* Left Sidebar Navigation */}
          <div className="w-64 bg-black/40 border-r border-white/10 p-6">
            <div className="mb-8">
              <h2 className="text-white font-bold text-xl font-mono">SETTINGS</h2>
            </div>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                      ${activeTab === tab.id
                        ? 'bg-white/[0.1] text-white ring-1 ring-white/[0.06]'
                        : 'text-zinc-500 hover:text-white hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Content Panel */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06]">
              <h3 className="text-zinc-100 font-semibold text-base tracking-tight">
                {tabs.find(t => t.id === activeTab)?.label}
              </h3>
              <Dialog.Close asChild>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {activeTab === 'general' && (
                <div className="space-y-8">
                  {/* Auto-save Toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <label className="text-white text-sm font-medium block">Auto-save to disk</label>
                      <p className="text-gray-400 text-xs mt-1.5">Automatically save your work every 5 minutes</p>
                    </div>
                    <Switch.Root
                      checked={autoSave}
                      onCheckedChange={setAutoSave}
                      className="w-11 h-6 bg-white/20 rounded-full relative data-[state=checked]:bg-blue-500 transition-colors duration-200"
                    >
                      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-200 translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-lg" />
                    </Switch.Root>
                  </div>

                  {/* Snap to Grid Toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <label className="text-white text-sm font-medium block">Snap to Grid</label>
                      <p className="text-gray-400 text-xs mt-1.5">Align objects to the canvas grid</p>
                    </div>
                    <Switch.Root
                      checked={snapToGrid}
                      onCheckedChange={setSnapToGrid}
                      className="w-11 h-6 bg-white/20 rounded-full relative data-[state=checked]:bg-blue-500 transition-colors duration-200"
                    >
                      <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-200 translate-x-0.5 data-[state=checked]:translate-x-[22px] shadow-lg" />
                    </Switch.Root>
                  </div>

                  {/* Export Format Dropdown */}
                  <div>
                    <label className="text-white text-sm font-medium block mb-3">Default Export Format</label>
                    <Select.Root value={exportFormat} onValueChange={setExportFormat}>
                      <Select.Trigger className="w-full max-w-md flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm hover:bg-white/10 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50">
                        <Select.Value />
                        <Select.Icon>
                          <ChevronDown size={18} className="text-gray-400" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                          <Select.Viewport className="p-2">
                            <Select.Item value="png" className="px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 hover:text-white rounded-lg cursor-pointer outline-none">
                              <Select.ItemText>PNG (Raster Image)</Select.ItemText>
                            </Select.Item>
                            <Select.Item value="svg" className="px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 hover:text-white rounded-lg cursor-pointer outline-none">
                              <Select.ItemText>SVG (Vector Image)</Select.ItemText>
                            </Select.Item>
                            <Select.Item value="json" className="px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 hover:text-white rounded-lg cursor-pointer outline-none">
                              <Select.ItemText>JSON (Project Data)</Select.ItemText>
                            </Select.Item>
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>

                  {/* Clear Canvas Action */}
                  <div className="pt-8 mt-8 border-t border-white/10">
                    <button className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 hover:border-red-500/50 text-red-400 rounded-xl text-sm font-semibold transition-all duration-200">
                      Clear Canvas
                    </button>
                    <p className="text-gray-500 text-xs mt-2">This action cannot be undone</p>
                  </div>
                </div>
              )}

              {activeTab === 'canvas' && (
                <div className="space-y-4">
                  <p className="text-gray-400 text-sm">Canvas and grid settings will appear here.</p>
                </div>
              )}

              {activeTab === 'shortcuts' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                      <span className="text-gray-300 text-sm font-medium">Select Tool</span>
                      <kbd className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm font-mono text-white">V</kbd>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                      <span className="text-gray-300 text-sm font-medium">Pan Tool</span>
                      <kbd className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm font-mono text-white">H</kbd>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                      <span className="text-gray-300 text-sm font-medium">Draw Tool</span>
                      <kbd className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm font-mono text-white">P</kbd>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-white/5">
                      <span className="text-gray-300 text-sm font-medium">Text Tool</span>
                      <kbd className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm font-mono text-white">T</kbd>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <h3 className="text-3xl font-bold text-white mb-3 font-mono tracking-wider">DVAMOCLES</h3>
                    <p className="text-gray-400 text-base mb-2">Whiteboard Application</p>
                    <p className="text-gray-500 text-sm font-mono">Version 1.0.0</p>
                  </div>
                  <div className="text-center border-t border-white/10 pt-8">
                    <p className="text-gray-400 text-sm">© 2026 Dvamocles. All rights reserved.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

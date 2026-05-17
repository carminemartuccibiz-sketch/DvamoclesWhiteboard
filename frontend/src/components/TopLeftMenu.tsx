import { Save, Download, Trash2, Settings } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useState } from 'react';

interface TopLeftMenuProps {
  onOpenSettings: () => void;
}

export function TopLeftMenu({ onOpenSettings }: TopLeftMenuProps) {
  const [documentTitle, setDocumentTitle] = useState('Untitled Project 1');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  return (
    <div className="fixed top-8 left-8 z-50 flex items-center gap-4">
      {/* Logo & Document Title Combined */}
      <div className="flex items-center gap-4 px-4 py-2.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl">
        {/* Logo */}
        <div className="text-white font-mono tracking-wider border-r border-white/20 pr-4">
          <span className="text-lg font-bold">DVAMOCLES</span>
        </div>

        {/* Document Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditingTitle(false);
            }}
            autoFocus
            className="bg-transparent text-white text-sm font-medium outline-none min-w-[160px]"
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="text-white text-sm font-medium hover:text-gray-300 transition-colors duration-200"
          >
            {documentTitle}
          </button>
        )}

        {/* Settings Button */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 ml-2"
              aria-label="Menu"
            >
              <Settings size={18} />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[200px] bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl"
              sideOffset={8}
            >
              <DropdownMenu.Item className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-gray-200 hover:bg-white/10 hover:text-white cursor-pointer outline-none">
                <Save size={16} />
                Save Project
              </DropdownMenu.Item>
              <DropdownMenu.Item className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-gray-200 hover:bg-white/10 hover:text-white cursor-pointer outline-none">
                <Download size={16} />
                Export
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-white/10 my-2" />
              <DropdownMenu.Item
                onSelect={onOpenSettings}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-gray-200 hover:bg-white/10 hover:text-white cursor-pointer outline-none"
              >
                <Settings size={16} />
                Settings
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-white/10 my-2" />
              <DropdownMenu.Item className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer outline-none">
                <Trash2 size={16} />
                Clear Canvas
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}

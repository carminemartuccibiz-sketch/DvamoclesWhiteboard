import { FileImage, FileCode2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useEngine } from '../engine/EngineContext';
import { exportDocumentAsPng, exportDocumentAsSvg } from '../lib/exportDocument';
import { chrome } from './ui/chrome';

interface ExportMenuItemsProps {
  documentTitle: string;
  isDarkMode?: boolean;
}

export function ExportMenuItems({ documentTitle }: ExportMenuItemsProps) {
  const engine = useEngine();

  const runExport = (fn: () => Promise<void>) => {
    void fn().catch(() => {
      /* export failed */
    });
  };

  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger className={chrome.dropdownItem}>
        <FileImage size={16} className="text-zinc-500" />
        Export
        <span className="ml-auto text-zinc-600 text-xs">›</span>
      </DropdownMenu.SubTrigger>
      <DropdownMenu.Portal>
        <DropdownMenu.SubContent className={chrome.dropdown} sideOffset={4} alignOffset={-4}>
          <DropdownMenu.Item
            className={chrome.dropdownItem}
            onSelect={(e) => {
              e.preventDefault();
              runExport(() => exportDocumentAsPng(engine, documentTitle));
            }}
          >
            <FileImage size={16} className="text-zinc-500" />
            Export as PNG
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className={chrome.dropdownItem}
            onSelect={(e) => {
              e.preventDefault();
              runExport(() => exportDocumentAsSvg(engine, documentTitle));
            }}
          >
            <FileCode2 size={16} className="text-zinc-500" />
            Export as SVG
          </DropdownMenu.Item>
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  );
}

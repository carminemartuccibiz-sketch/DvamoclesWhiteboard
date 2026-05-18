import { Check, Download, Loader2, Save, Settings, Trash2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSnapshot, useEditor } from 'tldraw';
import { chrome } from './ui/chrome';

const API_BASE = 'http://localhost:8000';

interface TopLeftMenuProps {
  onOpenSettings: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function TopLeftMenu({ onOpenSettings }: TopLeftMenuProps) {
  const editor = useEditor();
  const [documentTitle, setDocumentTitle] = useState('Untitled Project 1');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  const handleSaveProject = useCallback(async () => {
    if (saveStatus === 'saving') return;

    setSaveStatus('saving');

    try {
      const snapshot = getSnapshot(editor.store);

      const response = await fetch(`${API_BASE}/api/projects/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: snapshot,
          project_name: documentTitle,
        }),
      });

      if (!response.ok) {
        throw new Error(`Save failed (${response.status})`);
      }

      setSaveStatus('saved');
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
    }
  }, [editor, documentTitle, saveStatus]);

  const saveLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved'
        ? 'Saved!'
        : saveStatus === 'error'
          ? 'Save failed'
          : 'Save Project';

  const SaveIcon =
    saveStatus === 'saving'
      ? Loader2
      : saveStatus === 'saved'
        ? Check
        : Save;

  return (
    <div className="fixed top-6 left-6 z-50">
      <div className={`flex items-center gap-3 px-4 py-2.5 ${chrome.topChip}`}>
        <div className="text-white font-mono tracking-[0.12em] border-r border-white/[0.08] pr-4 shrink-0">
          <span className="text-sm font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            DVAMOCLES
          </span>
          <span className="block text-[9px] text-zinc-500 tracking-[0.2em] mt-0.5">SWORD™</span>
        </div>

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
            className="bg-transparent text-zinc-100 text-sm font-medium outline-none min-w-[160px] border-b border-blue-500/50 pb-0.5"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingTitle(true)}
            className="text-sm font-medium text-zinc-200 hover:text-white transition-colors duration-200 truncate max-w-[200px]"
          >
            {documentTitle}
          </button>
        )}

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className={chrome.iconBtn} aria-label="Menu">
              <Settings size={18} />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className={chrome.dropdown} sideOffset={10} align="start">
              <DropdownMenu.Item
                className={chrome.dropdownItem}
                disabled={saveStatus === 'saving'}
                onSelect={(e) => {
                  e.preventDefault();
                  void handleSaveProject();
                }}
              >
                <SaveIcon
                  size={16}
                  className={
                    saveStatus === 'saving'
                      ? 'text-zinc-500 animate-spin'
                      : saveStatus === 'saved'
                        ? 'text-emerald-400'
                        : saveStatus === 'error'
                          ? 'text-red-400'
                          : 'text-zinc-500'
                  }
                />
                {saveLabel}
              </DropdownMenu.Item>
              <DropdownMenu.Item className={chrome.dropdownItem}>
                <Download size={16} className="text-zinc-500" />
                Export
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-white/[0.06] my-1.5 mx-1" />
              <DropdownMenu.Item className={chrome.dropdownItem} onSelect={onOpenSettings}>
                <Settings size={16} className="text-zinc-500" />
                Settings
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="h-px bg-white/[0.06] my-1.5 mx-1" />
              <DropdownMenu.Item
                className={`${chrome.dropdownItem} text-red-400/90 hover:text-red-300 hover:bg-red-500/10`}
              >
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

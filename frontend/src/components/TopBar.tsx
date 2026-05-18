import { Check, Loader2, Moon, Plus, Minus, Save, Settings, Sun, Trash2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Switch from '@radix-ui/react-switch';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSnapshot, useEditor } from 'tldraw';
import { ExportMenuItems } from './ExportMenu';
import { chrome } from './ui/chrome';
import { glassCard } from './ui/panel';
import { cn } from './ui/utils';

const API_BASE = 'http://127.0.0.1:8000';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface TopBarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
}

export function TopBar({ isDarkMode, onToggleDarkMode, onOpenSettings }: TopBarProps) {
  const editor = useEditor();
  const [documentTitle, setDocumentTitle] = useState('Untitled Project 1');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [zoom, setZoom] = useState(100);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncZoom = useCallback(() => {
    setZoom(Math.round(editor.getCamera().z * 100));
  }, [editor]);

  useEffect(() => {
    syncZoom();
    const unlisten = editor.store.listen(syncZoom);
    return () => unlisten();
  }, [editor, syncZoom]);

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
      if (!response.ok) throw new Error(`Save failed (${response.status})`);
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
    saveStatus === 'saving' ? Loader2 : saveStatus === 'saved' ? Check : Save;

  return (
    <div className="w-full flex flex-wrap items-center justify-center gap-3">
      <div
        className={cn(
          glassCard,
          'pointer-events-auto flex flex-wrap items-center gap-3 px-4 py-3 rounded-full max-w-full',
        )}
      >
        <div className="flex items-center gap-2 pr-3 border-r border-white/10 shrink-0">
          <div className="w-6 h-6 bg-[#2F80ED] rounded flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 2L3 6H7V14H9V6H13L8 2Z" fill="white" />
            </svg>
          </div>
          <span className="text-white/90 text-sm font-medium tracking-tight font-ui hidden sm:inline">
            DVAMOCLES SWORD™
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center min-w-[120px] px-2">
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
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/90 text-sm focus:outline-none focus:border-[#2F80ED] min-w-[160px] text-center font-ui"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="px-3 py-1.5 text-white/90 text-sm hover:bg-white/5 rounded-lg transition-colors font-ui truncate max-w-[240px]"
            >
              {documentTitle}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => void handleSaveProject()}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#2F80ED] hover:bg-[#2F80ED]/90 disabled:opacity-60 text-white text-sm rounded-lg transition-colors font-ui"
          >
            <SaveIcon
              size={16}
              className={saveStatus === 'saving' ? 'animate-spin' : undefined}
            />
            Save
          </button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/90 rounded-lg transition-colors border border-white/10"
                aria-label="Menu"
              >
                <Settings className="w-4 h-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={chrome.dropdown} sideOffset={10} align="end">
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
                <ExportMenuItems documentTitle={documentTitle} isDarkMode={isDarkMode} />
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

      <div
        className={cn(
          glassCard,
          'pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full shrink-0',
        )}
      >
        <Sun
          size={17}
          className={cn('transition-colors', isDarkMode ? 'text-zinc-600' : 'text-amber-400')}
        />
        <Switch.Root
          checked={isDarkMode}
          onCheckedChange={onToggleDarkMode}
          className="w-11 h-6 bg-zinc-800 rounded-full relative border border-white/[0.08] data-[state=checked]:bg-zinc-700 transition-colors"
        >
          <Switch.Thumb className="block w-[18px] h-[18px] bg-white rounded-full shadow-md transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
        </Switch.Root>
        <Moon
          size={17}
          className={cn('transition-colors', isDarkMode ? 'text-blue-400' : 'text-zinc-600')}
        />

        <span className="w-px h-5 bg-white/10" />

        <button
          type="button"
          onClick={() => editor.zoomOut()}
          className={chrome.iconBtn}
          aria-label="Zoom out"
        >
          <Minus size={16} strokeWidth={2.5} />
        </button>
        <span className="text-xs font-mono text-zinc-200 min-w-[44px] text-center tabular-nums font-medium">
          {zoom}%
        </span>
        <button
          type="button"
          onClick={() => editor.zoomIn()}
          className={chrome.iconBtn}
          aria-label="Zoom in"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

import {
  Check,
  FolderOpen,
  Loader2,
  Moon,
  Minus,
  Plus,
  Save,
  Settings,
  Sun,
  Trash2,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Switch from '@radix-ui/react-switch';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useEngine } from '../engine/EngineContext';
import { loadProjectFromBackend, saveProjectToBackend } from '../lib/state/canvasPersistence';
import { ExportMenuItems } from './ExportMenu';
import { chrome } from './ui/chrome';
import { glassCard } from './ui/panel';
import { cn } from './ui/utils';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface TopBarProps {
  isDarkMode: boolean;
  onDarkModeChange: (value: boolean) => void;
  onOpenSettings: () => void;
}

function slugFromTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 128) || 'untitled';
}

export function TopBar({ isDarkMode, onDarkModeChange, onOpenSettings }: TopBarProps) {
  const engine = useEngine();
  const [documentTitle, setDocumentTitle] = useState('Untitled Project 1');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('idle');
  const [zoom, setZoom] = useState(engine.zoomPercent);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return engine.subscribe(() => setZoom(engine.zoomPercent));
  }, [engine]);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, []);

  const handleSaveProject = useCallback(async () => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      const projectId = slugFromTitle(documentTitle);
      await saveProjectToBackend(engine.store, engine.camera, {
        projectName: documentTitle,
        projectId,
      });
      setSaveStatus('saved');
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
    }
  }, [engine, documentTitle, saveStatus]);

  const handleLoadProject = useCallback(async () => {
    if (loadStatus === 'loading') return;
    setLoadStatus('loading');
    try {
      const projectId = slugFromTitle(documentTitle);
      const result = await loadProjectFromBackend(projectId);
      engine.loadWorldDocument(result.document);
      setDocumentTitle(result.projectName);
      setLoadStatus('loaded');
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => setLoadStatus('idle'), 2000);
    } catch {
      setLoadStatus('error');
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => setLoadStatus('idle'), 2500);
    }
  }, [engine, documentTitle, loadStatus]);

  const saveLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'saved'
        ? 'Saved!'
        : saveStatus === 'error'
          ? 'Save failed'
          : 'Save Project';

  const loadLabel =
    loadStatus === 'loading'
      ? 'Loading…'
      : loadStatus === 'loaded'
        ? 'Loaded!'
        : loadStatus === 'error'
          ? 'Load failed'
          : 'Open Project';

  const SaveIcon =
    saveStatus === 'saving' ? Loader2 : saveStatus === 'saved' ? Check : Save;

  const LoadIcon =
    loadStatus === 'loading' ? Loader2 : loadStatus === 'loaded' ? Check : FolderOpen;

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
                <DropdownMenu.Item
                  className={chrome.dropdownItem}
                  disabled={loadStatus === 'loading'}
                  onSelect={(e) => {
                    e.preventDefault();
                    void handleLoadProject();
                  }}
                >
                  <LoadIcon
                    size={16}
                    className={
                      loadStatus === 'loading'
                        ? 'text-zinc-500 animate-spin'
                        : loadStatus === 'loaded'
                          ? 'text-emerald-400'
                          : loadStatus === 'error'
                            ? 'text-red-400'
                            : 'text-zinc-500'
                    }
                  />
                  {loadLabel}
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
                  onSelect={() => engine.clearCanvas()}
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
          onCheckedChange={onDarkModeChange}
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
          onClick={() => engine.zoomOut()}
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
          onClick={() => engine.zoomIn()}
          className={chrome.iconBtn}
          aria-label="Zoom in"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

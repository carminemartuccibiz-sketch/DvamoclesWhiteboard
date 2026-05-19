import { MapPin, Plus, Upload, FolderOpen } from 'lucide-react';
import { useRef, useState } from 'react';
import { useEngine } from '../engine/EngineContext';
import { FloatingCard } from './ui/panel';
import { chrome } from './ui/chrome';
import { cn } from './ui/utils';

const sidebarScrollClass =
  'flex flex-col gap-4 w-[280px] max-w-[min(280px,28vw)] shrink-0 min-h-0 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar pb-6';

export function LeftSidebar() {
  const engine = useEngine();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [schemaName, setSchemaName] = useState('');
  const [outline] = useState<{ id: string; name: string }[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    const bounds = engine.getVisibleBounds();
    const centerX = bounds ? (bounds.minX + bounds.maxX) / 2 : 0;
    const centerY = bounds ? (bounds.minY + bounds.maxY) / 2 : 0;

    for (const file of list) {
      if (file.type.startsWith('image/')) {
        await engine.importImageFile(file, centerX, centerY);
        continue;
      }
      await engine.importDocumentFile(file, centerX, centerY);
    }
  };

  return (
    <aside className={sidebarScrollClass}>
      <FloatingCard className="flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-white/10 shrink-0">
          <h3 className="text-white/90 text-sm font-medium font-ui">Schemas & Groups</h3>
        </div>
        <div className="px-4 py-3 border-b border-white/5 shrink-0">
          <label className={chrome.sectionLabel}>Element Naming</label>
          <div className="space-y-2">
            <input
              type="text"
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              placeholder="Schema name…"
              className={chrome.input}
            />
            <button
              type="button"
              className={`w-full ${chrome.primaryBtn} flex items-center justify-center gap-2 opacity-50 cursor-not-allowed`}
            >
              <Plus size={16} />
              Name Selection
            </button>
          </div>
        </div>
        <div className="px-2 py-2 shrink-0">
          <label className={cn(chrome.sectionLabel, 'px-2')}>Outline</label>
          {outline.length === 0 ? (
            <p className="text-xs text-zinc-600 px-3 py-2 leading-relaxed">
              Groups will appear here once the world entity system is connected.
            </p>
          ) : (
            <div className="space-y-0.5">
              {outline.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className={cn(
                    chrome.outlineItem,
                    activeId === item.id && 'bg-white/[0.08] text-white ring-1 ring-white/[0.06]',
                  )}
                >
                  <MapPin size={15} className="text-zinc-500" />
                  <span className="flex-1 text-left truncate">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </FloatingCard>

      <FloatingCard className="shrink-0">
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="text-white/90 text-sm font-medium font-ui">Asset Library</h3>
        </div>
        <div className="p-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.doc,.docx"
            className="hidden"
            onChange={async (e) => {
              if (e.target.files?.length) {
                await processFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files.length > 0) {
                await processFiles(e.dataTransfer.files);
              }
            }}
            className={cn(
              'relative border-2 border-dashed rounded-xl p-5 transition-all duration-300',
              isDragging
                ? 'border-[#2F80ED]/60 bg-[#2F80ED]/10'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]',
            )}
          >
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div
                className={cn(
                  'p-3 rounded-2xl transition-colors',
                  isDragging ? 'bg-[#2F80ED]/20' : 'bg-white/[0.06]',
                )}
              >
                <Upload
                  size={22}
                  className={cn('transition-colors', isDragging ? 'text-[#2F80ED]' : 'text-zinc-500')}
                />
              </div>
              <div>
                <p className="text-sm text-zinc-300 font-medium font-ui">Drop files here</p>
                <p className="text-xs text-zinc-600 mt-1">Images · documents · assets</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={chrome.ghostBtn}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen size={16} />
                  Browse files
                </span>
              </button>
            </div>
          </div>
        </div>
      </FloatingCard>
    </aside>
  );
}

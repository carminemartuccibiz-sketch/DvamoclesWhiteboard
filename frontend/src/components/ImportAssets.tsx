import { Upload, FolderOpen } from 'lucide-react';
import { useRef, useState } from 'react';
import { useEditor } from 'tldraw';
import { importFilesAtPoint } from '../lib/tldraw/importFiles';
import { ChromePanel, chrome } from './ui/chrome';
import { cn } from './ui/utils';

export function ImportAssets() {
  const editor = useEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    await importFilesAtPoint(editor, list);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  return (
    <ChromePanel title="Import Assets">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={async (e) => {
          if (e.target.files?.length) {
            await processFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 transition-all duration-300',
          isDragging
            ? 'border-blue-500/60 bg-blue-500/10 scale-[1.01]'
            : 'border-white/[0.1] bg-white/[0.02] hover:border-white/[0.18] hover:bg-white/[0.04]',
        )}
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div
            className={cn(
              'p-3 rounded-2xl transition-colors duration-300',
              isDragging ? 'bg-blue-500/20' : 'bg-white/[0.06]',
            )}
          >
            <Upload
              size={22}
              className={cn('transition-colors', isDragging ? 'text-blue-400' : 'text-zinc-500')}
            />
          </div>
          <div>
            <p className="text-sm text-zinc-300 font-medium">Drop files here</p>
            <p className="text-xs text-zinc-600 mt-1">Images · documents · assets</p>
          </div>
          <button type="button" onClick={() => fileInputRef.current?.click()} className={chrome.ghostBtn}>
            <span className="flex items-center gap-2">
              <FolderOpen size={16} />
              Browse files
            </span>
          </button>
        </div>
      </div>
    </ChromePanel>
  );
}

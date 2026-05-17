import { Upload, FolderOpen } from 'lucide-react';
import { useRef, useState } from 'react';
import { useEditor } from 'tldraw';
import { importFilesAtPoint } from '../lib/tldraw/importFiles';

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

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-[#1e1e1e] border border-white/10 rounded-xl p-5 shadow-2xl">
      <h3 className="text-sm font-semibold text-white mb-4 font-mono tracking-wide">IMPORT ASSETS</h3>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-6 transition-all duration-200
          ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-white/20 hover:border-white/30 bg-white/5'
          }
        `}
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="p-3 bg-white/10 rounded-full">
            <Upload size={24} className="text-gray-400" />
          </div>
          <div>
            <p className="text-sm text-gray-300 font-medium mb-1">Drag & Drop Files Here</p>
            <p className="text-xs text-gray-500">Images import natively · other files become cards</p>
          </div>
          <button
            type="button"
            onClick={handleBrowse}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
          >
            <FolderOpen size={16} />
            Browse Files / Images
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        PNG, JPG, SVG, PDF, DOC — system-agnostic file pipeline
      </p>
    </div>
  );
}

import { Share2, Download, Settings } from 'lucide-react';
import { useState } from 'react';

interface TopBarProps {
  onSettingsClick?: () => void;
}

export default function TopBar({ onSettingsClick }: TopBarProps) {
  const [documentName, setDocumentName] = useState('Untitled Diagram');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <div
        className="
          flex items-center gap-3 px-4 py-3
          bg-[#0A0A0A]/80 backdrop-blur-[20px]
          border border-white/10
          rounded-full shadow-2xl
        "
        style={{ minWidth: '600px' }}
      >
        {/* Left: Logo + Brand */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/10">
          <div className="w-6 h-6 bg-[#2F80ED] rounded flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2L3 6H7V14H9V6H13L8 2Z"
                fill="white"
              />
            </svg>
          </div>
          <span className="text-white/90 text-sm font-medium tracking-tight">
            DVAMOCLES SWORD™
          </span>
        </div>

        {/* Center: Editable Document Name */}
        <div className="flex-1 flex items-center justify-center px-4">
          {isEditing ? (
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditing(false);
              }}
              autoFocus
              className="
                bg-white/5 border border-white/10 rounded-lg
                px-3 py-1.5 text-white/90 text-sm
                focus:outline-none focus:border-[#2F80ED]
                min-w-[200px] text-center
              "
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="
                px-3 py-1.5 text-white/90 text-sm
                hover:bg-white/5 rounded-lg transition-colors
              "
            >
              {documentName}
            </button>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <button
            className="
              flex items-center gap-2 px-3 py-1.5
              bg-[#2F80ED] hover:bg-[#2F80ED]/90
              text-white text-sm
              rounded-lg transition-colors
            "
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>

          <button
            className="
              flex items-center gap-2 px-3 py-1.5
              bg-white/5 hover:bg-white/10
              text-white/90 text-sm
              rounded-lg transition-colors border border-white/10
            "
          >
            <Download className="w-4 h-4" />
            Export
          </button>

          <button
            onClick={onSettingsClick}
            className="
              w-9 h-9 flex items-center justify-center
              bg-white/5 hover:bg-white/10
              text-white/90
              rounded-lg transition-colors border border-white/10
            "
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

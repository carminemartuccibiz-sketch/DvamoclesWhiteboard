import {
  MousePointer2,
  Hand,
  Square,
  Diamond,
  Circle,
  ArrowRight,
  Pencil,
  Type,
  Eraser,
  GitBranch,
} from 'lucide-react';

const tools = [
  { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { id: 'hand', icon: Hand, label: 'Hand', shortcut: 'H' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { id: 'diamond', icon: Diamond, label: 'Diamond', shortcut: 'D' },
  { id: 'circle', icon: Circle, label: 'Ellipse', shortcut: 'O' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
  { id: 'pencil', icon: Pencil, label: 'Pencil', shortcut: 'P' },
  { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { id: 'branch', icon: GitBranch, label: 'Branch', shortcut: 'B' },
];

interface ToolButtonProps {
  icon: React.ElementType;
  label: string;
  shortcut: string;
  active?: boolean;
}

function ToolButton({ icon: Icon, label, shortcut, active = false }: ToolButtonProps) {
  return (
    <button
      className={`
        relative group
        w-10 h-10 rounded-lg flex items-center justify-center
        transition-all duration-200
        ${
          active
            ? 'bg-[#2F80ED] text-white'
            : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
        }
      `}
      aria-label={`${label} (${shortcut})`}
    >
      <Icon className="w-5 h-5" />

      {/* Tooltip */}
      <div
        className="
          absolute bottom-full mb-2 px-2 py-1
          bg-[#0A0A0A]/95 backdrop-blur-sm
          border border-white/20 rounded-md
          opacity-0 group-hover:opacity-100
          transition-opacity pointer-events-none
          whitespace-nowrap
        "
      >
        <div className="flex items-center gap-2">
          <span className="text-white text-xs">{label}</span>
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70 text-xs font-mono">
            {shortcut}
          </kbd>
        </div>
      </div>
    </button>
  );
}

export default function BottomToolbar() {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div
        className="
          flex items-center gap-2 px-3 py-3
          bg-[#0A0A0A]/80 backdrop-blur-[20px]
          border border-white/10
          rounded-full shadow-2xl
        "
      >
        {tools.map((tool, index) => (
          <ToolButton
            key={tool.id}
            icon={tool.icon}
            label={tool.label}
            shortcut={tool.shortcut}
            active={index === 0}
          />
        ))}
      </div>
    </div>
  );
}

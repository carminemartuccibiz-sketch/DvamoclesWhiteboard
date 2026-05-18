import { useCallback, useEffect, useState } from 'react';
import {
  Circle,
  Diamond,
  Eraser,
  GitBranch,
  Hand,
  MousePointer2,
  MoveRight,
  Pen,
  Square,
  Type,
  type LucideIcon,
} from 'lucide-react';
import {
  GeoShapeGeoStyle,
  useEditor,
  type TLGeoShapeGeoStyle,
} from 'tldraw';
import { createBranchFromSelection } from '../lib/tldraw/createBranch';
import { chrome } from './ui/chrome';
import { cn } from './ui/utils';

type ToolId =
  | 'select'
  | 'pan'
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'arrow'
  | 'draw'
  | 'text'
  | 'eraser';

type ToolbarEntry =
  | { kind: 'tool'; id: ToolId; icon: LucideIcon; label: string }
  | { kind: 'action'; id: 'branch'; icon: LucideIcon; label: string };

const TOOLBAR_ENTRIES: ToolbarEntry[] = [
  { kind: 'tool', id: 'select', icon: MousePointer2, label: 'Select' },
  { kind: 'tool', id: 'pan', icon: Hand, label: 'Pan' },
  { kind: 'tool', id: 'rectangle', icon: Square, label: 'Rectangle' },
  { kind: 'tool', id: 'circle', icon: Circle, label: 'Circle' },
  { kind: 'tool', id: 'diamond', icon: Diamond, label: 'Diamond' },
  { kind: 'tool', id: 'arrow', icon: MoveRight, label: 'Arrow' },
  { kind: 'tool', id: 'draw', icon: Pen, label: 'Draw' },
  { kind: 'tool', id: 'text', icon: Type, label: 'Text' },
  { kind: 'tool', id: 'eraser', icon: Eraser, label: 'Eraser' },
  { kind: 'action', id: 'branch', icon: GitBranch, label: 'Branch / Fork' },
];

const GEO_TOOL_MAP: Partial<Record<ToolId, TLGeoShapeGeoStyle>> = {
  rectangle: 'rectangle',
  circle: 'ellipse',
  diamond: 'diamond',
};

function geoToToolId(geo: TLGeoShapeGeoStyle): ToolId | null {
  if (geo === 'rectangle') return 'rectangle';
  if (geo === 'ellipse') return 'circle';
  if (geo === 'diamond') return 'diamond';
  return null;
}

export function FloatingToolbar() {
  const editor = useEditor();
  const [activeTool, setActiveTool] = useState<ToolId | 'branch'>('select');

  const syncFromEditor = useCallback(() => {
    const currentTool = editor.getCurrentToolId();

    if (currentTool === 'hand') {
      setActiveTool('pan');
      return;
    }

    if (currentTool === 'geo') {
      const mapped = geoToToolId(editor.getStyleForNextShape(GeoShapeGeoStyle));
      if (mapped) setActiveTool(mapped);
      return;
    }

    if (
      currentTool === 'select' ||
      currentTool === 'arrow' ||
      currentTool === 'draw' ||
      currentTool === 'text' ||
      currentTool === 'eraser'
    ) {
      setActiveTool(currentTool);
    }
  }, [editor]);

  useEffect(() => {
    syncFromEditor();
    const unlisten = editor.store.listen(syncFromEditor, { source: 'user' });
    return () => unlisten();
  }, [editor, syncFromEditor]);

  const activateGeoTool = (geo: TLGeoShapeGeoStyle, toolId: ToolId) => {
    editor.setStyleForNextShapes(GeoShapeGeoStyle, geo);
    editor.setCurrentTool('geo');
    setActiveTool(toolId);
  };

  const handleToolChange = (toolId: ToolId) => {
    switch (toolId) {
      case 'pan':
        editor.setCurrentTool('hand');
        break;
      case 'rectangle':
      case 'circle':
      case 'diamond':
        activateGeoTool(GEO_TOOL_MAP[toolId]!, toolId);
        return;
      default:
        editor.setCurrentTool(toolId);
    }
    setActiveTool(toolId);
  };

  const handleBranch = () => {
    if (createBranchFromSelection(editor, 3)) {
      setActiveTool('select');
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className={cn(chrome.floatingBar, 'flex items-center gap-0.5 px-2 py-2')}>
        {TOOLBAR_ENTRIES.map((entry) => {
          const Icon = entry.icon;
          const isActive = entry.kind === 'tool' && activeTool === entry.id;
          const isAction = entry.kind === 'action';

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() =>
                entry.kind === 'action' ? handleBranch() : handleToolChange(entry.id)
              }
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-white/[0.14] text-white shadow-inner ring-1 ring-white/[0.1]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.08]',
                isAction && 'ml-1 border-l border-white/[0.08] pl-3 rounded-l-none hover:text-blue-300',
              )}
              aria-label={entry.label}
              title={entry.label}
            >
              <Icon size={19} strokeWidth={isActive ? 2.25 : 2} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

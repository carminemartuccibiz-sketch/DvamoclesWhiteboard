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
  | {
      kind: 'tool';
      id: ToolId;
      icon: LucideIcon;
      label: string;
    }
  | {
      kind: 'action';
      id: 'branch';
      icon: LucideIcon;
      label: string;
    };

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
      const geo = editor.getStyleForNextShape(GeoShapeGeoStyle);
      const mapped = geoToToolId(geo);
      if (mapped) {
        setActiveTool(mapped);
      }
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
        break;
    }
    setActiveTool(toolId);
  };

  const handleBranch = () => {
    const created = createBranchFromSelection(editor, 3);
    if (created) {
      setActiveTool('select');
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-3 py-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
        {TOOLBAR_ENTRIES.map((entry) => {
          const Icon = entry.icon;
          const isActive =
            entry.kind === 'tool'
              ? activeTool === entry.id
              : false;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() =>
                entry.kind === 'action' ? handleBranch() : handleToolChange(entry.id)
              }
              className={`
                p-2.5 rounded-lg transition-all duration-200
                hover:bg-white/10
                ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-gray-300 hover:text-white'
                }
              `}
              aria-label={entry.label}
              title={entry.label}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

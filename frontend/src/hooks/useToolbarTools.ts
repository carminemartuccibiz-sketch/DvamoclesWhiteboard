import { useCallback, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
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
  StickyNote,
  Type,
  ScrollText,
} from 'lucide-react';
import {
  DefaultColorStyle,
  GeoShapeGeoStyle,
  useEditor,
  type TLGeoShapeGeoStyle,
} from 'tldraw';
import { createBranchFromSelection } from '../lib/tldraw/createBranch';
import { createLinedPaper } from '../lib/tldraw/createLinedPaper';

export type ToolId =
  | 'select'
  | 'pan'
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'arrow'
  | 'draw'
  | 'text'
  | 'eraser'
  | 'note';

export type ToolbarActionId = 'branch' | 'linedPaper';

export type ToolbarEntry =
  | {
      kind: 'tool';
      id: ToolId;
      icon: LucideIcon;
      label: string;
      shortcut: string;
      digit?: string;
    }
  | {
      kind: 'action';
      id: ToolbarActionId;
      icon: LucideIcon;
      label: string;
      shortcut: string;
    };

export const TOOLBAR_ENTRIES: ToolbarEntry[] = [
  { kind: 'tool', id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V', digit: '1' },
  { kind: 'tool', id: 'pan', icon: Hand, label: 'Hand', shortcut: 'H', digit: '2' },
  { kind: 'tool', id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R', digit: '3' },
  { kind: 'tool', id: 'diamond', icon: Diamond, label: 'Diamond', shortcut: 'D', digit: '4' },
  { kind: 'tool', id: 'circle', icon: Circle, label: 'Ellipse', shortcut: 'O', digit: '5' },
  { kind: 'tool', id: 'arrow', icon: MoveRight, label: 'Arrow', shortcut: 'A', digit: '6' },
  { kind: 'tool', id: 'draw', icon: Pen, label: 'Draw', shortcut: 'P', digit: '7' },
  { kind: 'tool', id: 'text', icon: Type, label: 'Text', shortcut: 'T', digit: '8' },
  { kind: 'tool', id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E', digit: '9' },
  { kind: 'tool', id: 'note', icon: StickyNote, label: 'Sticky Note', shortcut: 'N' },
  { kind: 'action', id: 'linedPaper', icon: ScrollText, label: 'Lined Paper', shortcut: 'L' },
  { kind: 'action', id: 'branch', icon: GitBranch, label: 'Branch', shortcut: 'B' },
];

const GEO_TOOL_MAP: Partial<Record<ToolId, TLGeoShapeGeoStyle>> = {
  rectangle: 'rectangle',
  circle: 'ellipse',
  diamond: 'diamond',
};

const SHORTCUT_BY_KEY: Record<string, ToolId | ToolbarActionId> = {
  v: 'select',
  '1': 'select',
  h: 'pan',
  '2': 'pan',
  r: 'rectangle',
  '3': 'rectangle',
  d: 'diamond',
  '4': 'diamond',
  o: 'circle',
  '5': 'circle',
  a: 'arrow',
  '6': 'arrow',
  p: 'draw',
  '7': 'draw',
  t: 'text',
  '8': 'text',
  e: 'eraser',
  '9': 'eraser',
  n: 'note',
  l: 'linedPaper',
  b: 'branch',
};

function geoToToolId(geo: TLGeoShapeGeoStyle): ToolId | null {
  if (geo === 'rectangle') return 'rectangle';
  if (geo === 'ellipse') return 'circle';
  if (geo === 'diamond') return 'diamond';
  return null;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function useToolbarTools() {
  const editor = useEditor();
  const [activeTool, setActiveTool] = useState<ToolId | ToolbarActionId>('select');

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
      currentTool === 'eraser' ||
      currentTool === 'note'
    ) {
      setActiveTool(currentTool);
    }
  }, [editor]);

  useEffect(() => {
    syncFromEditor();
    const unlisten = editor.store.listen(syncFromEditor, { source: 'user' });
    return () => unlisten();
  }, [editor, syncFromEditor]);

  const activateGeoTool = useCallback(
    (geo: TLGeoShapeGeoStyle, toolId: ToolId) => {
      editor.setStyleForNextShapes(GeoShapeGeoStyle, geo);
      editor.setCurrentTool('geo');
      setActiveTool(toolId);
    },
    [editor],
  );

  const activateTool = useCallback(
    (toolId: ToolId | ToolbarActionId) => {
      if (toolId === 'branch') {
        if (createBranchFromSelection(editor, 3)) setActiveTool('select');
        return;
      }
      if (toolId === 'linedPaper') {
        createLinedPaper(editor);
        setActiveTool('select');
        return;
      }
      if (toolId === 'note') {
        editor.setStyleForNextShapes(DefaultColorStyle, 'yellow');
        editor.setCurrentTool('note');
        setActiveTool('note');
        return;
      }
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
    },
    [editor, activateGeoTool],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
      const mapped = SHORTCUT_BY_KEY[key];
      if (!mapped) return;

      event.preventDefault();
      activateTool(mapped);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activateTool]);

  return { activeTool, activateTool, entries: TOOLBAR_ENTRIES };
}

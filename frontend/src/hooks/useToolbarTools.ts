import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Circle,
  Diamond,
  Eraser,
  Hand,
  Link2,
  Minus,
  MousePointer2,
  MoveRight,
  Pen,
  ScrollText,
  Square,
  Type,
} from 'lucide-react';
import { useEngine } from '../engine/EngineContext';
import { shouldIgnoreCanvasShortcuts } from '../lib/keyboard/canvasShortcuts';
import { pluginManager } from '../plugins/pluginRegistry';
import type { PluginToolbarEntry } from '../plugins/types';

export type ToolId =
  | 'select'
  | 'pan'
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'arrow'
  | 'draw'
  | 'line'
  | 'text'
  | 'link'
  | 'eraser';

export type ToolbarActionId = 'linedPaper';

/** Any canvas tool id, including plugin-registered tools (`plugin:…`) */
export type ActiveToolId = ToolId | ToolbarActionId | string;

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
      shortcut?: string;
    }
  | PluginToolbarEntry;

export const CORE_TOOLBAR_ENTRIES: ToolbarEntry[] = [
  { kind: 'tool', id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V', digit: '1' },
  { kind: 'tool', id: 'pan', icon: Hand, label: 'Hand', shortcut: 'H', digit: '2' },
  { kind: 'tool', id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R', digit: '3' },
  { kind: 'tool', id: 'diamond', icon: Diamond, label: 'Diamond', shortcut: 'D', digit: '4' },
  { kind: 'tool', id: 'circle', icon: Circle, label: 'Ellipse', shortcut: 'O', digit: '5' },
  { kind: 'tool', id: 'arrow', icon: MoveRight, label: 'Arrow', shortcut: 'A', digit: '6' },
  { kind: 'tool', id: 'draw', icon: Pen, label: 'Draw', shortcut: 'P', digit: '7' },
  { kind: 'tool', id: 'line', icon: Minus, label: 'Line', shortcut: 'L', digit: '8' },
  { kind: 'tool', id: 'text', icon: Type, label: 'Text', shortcut: 'T', digit: '9' },
  { kind: 'tool', id: 'link', icon: Link2, label: 'Spatial Link', shortcut: 'K' },
  { kind: 'tool', id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { kind: 'action', id: 'linedPaper', icon: ScrollText, label: 'Lined Paper' },
];

function buildShortcutMap(entries: ToolbarEntry[]): Record<string, ActiveToolId> {
  const map: Record<string, ActiveToolId> = {
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
    l: 'line',
    '8': 'line',
    t: 'text',
    '9': 'text',
    k: 'link',
    e: 'eraser',
  };

  for (const entry of entries) {
    if (entry.kind === 'plugin-tool' && entry.shortcut) {
      map[entry.shortcut.toLowerCase()] = entry.id;
    }
  }

  return map;
}

export function useToolbarTools() {
  const engine = useEngine();
  const [activeTool, setActiveToolLocal] = useState<ActiveToolId>(engine.activeTool);

  const entries = useMemo<ToolbarEntry[]>(
    () => [...CORE_TOOLBAR_ENTRIES, ...pluginManager.getToolbarEntries()],
    [],
  );

  const shortcutByKey = useMemo(() => buildShortcutMap(entries), [entries]);

  useEffect(() => {
    return engine.subscribe(() => {
      setActiveToolLocal(engine.activeTool);
    });
  }, [engine]);

  const activateTool = useCallback(
    (toolId: ActiveToolId) => {
      if (toolId === 'linedPaper') return;

      const pluginEntry = entries.find(
        (entry): entry is PluginToolbarEntry =>
          entry.kind === 'plugin-tool' && entry.id === toolId,
      );

      if (pluginEntry) {
        const definition = pluginManager.findTool(pluginEntry.pluginId, pluginEntry.id);
        engine.setActiveTool(toolId);
        setActiveToolLocal(toolId);
        definition?.onActivate?.({
          engine: {
            activeTool: engine.activeTool,
            setActiveTool: engine.setActiveTool,
            selectedIds: engine.selectedIds,
            getAllEntities: engine.getAllEntities,
            getEntity: engine.getEntity,
            subscribe: engine.subscribe,
          },
          pluginId: pluginEntry.pluginId,
          toolId: pluginEntry.id,
        });
        return;
      }

      engine.setActiveTool(toolId);
      setActiveToolLocal(toolId);
    },
    [engine, entries],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (shouldIgnoreCanvasShortcuts(event)) return;

      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
      const mapped = shortcutByKey[key];
      if (!mapped) return;

      event.preventDefault();
      activateTool(mapped);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activateTool, shortcutByKey]);

  return { activeTool, activateTool, entries };
}

/** @deprecated Use CORE_TOOLBAR_ENTRIES — kept for imports that expect core-only list */
export const TOOLBAR_ENTRIES = CORE_TOOLBAR_ENTRIES;

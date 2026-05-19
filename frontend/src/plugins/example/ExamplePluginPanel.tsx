import { useMemo } from 'react';
import type { PluginPanelProps } from '../types';

export function ExamplePluginPanel({ engine, selection }: PluginPanelProps) {
  const summary = useMemo(() => {
    if (selection.selectedEntities.length === 0) {
      return 'Activate Highlight tool or select shapes to inspect.';
    }
    const types = selection.selectedEntities.map((e) => e.type);
    return `${selection.selectedEntities.length} entity(ies): ${types.join(', ')}`;
  }, [selection.selectedEntities]);

  return (
    <div className="space-y-3 text-sm">
      <p className="text-zinc-400 leading-relaxed">
        This panel is injected by the <span className="text-violet-300">example</span> plugin via
        the Plugin Registry. It appears when Highlight mode is active or when geometric shapes are
        selected.
      </p>
      <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2">
        <span className="text-xs text-violet-300/80 block mb-1">Selection</span>
        <span className="text-zinc-200 text-xs font-mono">{summary}</span>
      </div>
      <button
        type="button"
        className="w-full px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
        onClick={() => engine.setActiveTool('plugin:example-highlight')}
      >
        Switch to Highlight tool
      </button>
    </div>
  );
}

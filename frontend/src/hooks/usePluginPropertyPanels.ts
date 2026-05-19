import { useEffect, useMemo, useState } from 'react';
import { useEngine } from '../engine/EngineContext';
import { buildPluginSelectionContext, toPluginEngineApi } from '../plugins/engineAdapter';
import { pluginManager } from '../plugins/pluginRegistry';

export function usePluginPropertyPanels() {
  const engine = useEngine();
  const [, bump] = useState(0);

  useEffect(() => engine.subscribe(() => bump((n) => n + 1)), [engine]);

  const selection = useMemo(
    () => buildPluginSelectionContext(engine),
    [engine, bump, engine.activeTool, engine.selectedIds, engine.revision],
  );
  const pluginEngine = useMemo(() => toPluginEngineApi(engine), [engine]);

  const panels = useMemo(
    () => pluginManager.getPropertyPanelsForSelection(selection),
    [selection],
  );

  return { panels, pluginEngine, selection };
}

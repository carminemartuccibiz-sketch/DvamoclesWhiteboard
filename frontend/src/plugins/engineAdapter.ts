import type { useEngine } from '../engine/EngineContext';
import type { PluginEngineApi, PluginSelectionContext } from './types';

type EngineApi = ReturnType<typeof useEngine>;

export function toPluginEngineApi(engine: EngineApi): PluginEngineApi {
  return {
    activeTool: engine.activeTool,
    setActiveTool: engine.setActiveTool,
    selectedIds: engine.selectedIds,
    getAllEntities: engine.getAllEntities,
    getEntity: engine.getEntity,
    subscribe: engine.subscribe,
  };
}

export function buildPluginSelectionContext(engine: EngineApi): PluginSelectionContext {
  const selectedEntities = [...engine.selectedIds]
    .map((id) => engine.getEntity(id))
    .filter((entity): entity is NonNullable<typeof entity> => entity != null);

  return {
    activeTool: engine.activeTool,
    selectedIds: engine.selectedIds,
    selectedEntities,
    hasSelection: selectedEntities.length > 0,
  };
}

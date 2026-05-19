import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { BoardEntity } from '../lib/state/schema';

/** Engine surface exposed to plugins — core never imports plugin implementations */
export interface PluginEngineApi {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  selectedIds: ReadonlySet<string>;
  getAllEntities: () => BoardEntity[];
  getEntity: (id: string) => BoardEntity | null;
  subscribe: (listener: () => void) => () => void;
}

export interface PluginSelectionContext {
  activeTool: string;
  selectedIds: ReadonlySet<string>;
  selectedEntities: BoardEntity[];
  hasSelection: boolean;
}

export interface PluginToolContext {
  engine: PluginEngineApi;
  pluginId: string;
  toolId: string;
}

export interface PluginPanelProps {
  engine: PluginEngineApi;
  pluginId: string;
  selection: PluginSelectionContext;
}

export interface PluginToolDefinition {
  /** Unique tool id (convention: `plugin:{pluginId}:{name}`) */
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string;
  digit?: string;
  order?: number;
  onActivate?: (ctx: PluginToolContext) => void;
}

export interface PluginPropertiesPanelDefinition {
  id: string;
  title: string;
  component: ComponentType<PluginPanelProps>;
  /** When true, panel is mounted in the right sidebar */
  condition: (selection: PluginSelectionContext) => boolean;
  order?: number;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  tools?: PluginToolDefinition[];
  propertiesPanels?: PluginPropertiesPanelDefinition[];
  /** Entity types owned by this plugin (for custom shape routing in later phases) */
  entityTypes?: string[];
  initHook?: (manager: PluginManagerApi) => void | Promise<void>;
}

export interface PluginManagerApi {
  getPlugin(id: string): PluginManifest | undefined;
  getAllPlugins(): PluginManifest[];
  register(manifest: PluginManifest): void;
}

export type PluginToolbarEntry = {
  kind: 'plugin-tool';
  pluginId: string;
  id: string;
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  digit?: string;
  order: number;
};

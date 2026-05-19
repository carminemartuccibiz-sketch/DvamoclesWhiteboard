import type {
  PluginManifest,
  PluginManagerApi,
  PluginPropertiesPanelDefinition,
  PluginSelectionContext,
  PluginToolbarEntry,
  PluginToolDefinition,
} from './types';

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(-[\w.-]+)?$/;

function validateManifest(manifest: PluginManifest): void {
  if (!manifest.id || !/^[a-z][a-z0-9-]*$/.test(manifest.id)) {
    throw new Error(
      `[PluginManager] Invalid plugin id "${manifest.id}". Use lowercase kebab-case (e.g. "pbr-validator").`,
    );
  }
  if (!manifest.name?.trim()) {
    throw new Error(`[PluginManager] Plugin "${manifest.id}" requires a non-empty name.`);
  }
  if (!manifest.version || !SEMVER_PATTERN.test(manifest.version)) {
    throw new Error(
      `[PluginManager] Plugin "${manifest.id}" requires semver version (e.g. "1.0.0").`,
    );
  }

  const toolIds = new Set<string>();
  for (const tool of manifest.tools ?? []) {
    if (!tool.id || toolIds.has(tool.id)) {
      throw new Error(`[PluginManager] Duplicate or missing tool id in plugin "${manifest.id}".`);
    }
    toolIds.add(tool.id);
    if (!tool.label?.trim() || !tool.icon) {
      throw new Error(`[PluginManager] Tool "${tool.id}" in "${manifest.id}" needs label and icon.`);
    }
  }

  const panelIds = new Set<string>();
  for (const panel of manifest.propertiesPanels ?? []) {
    if (!panel.id || panelIds.has(panel.id)) {
      throw new Error(`[PluginManager] Duplicate or missing panel id in plugin "${manifest.id}".`);
    }
    panelIds.add(panel.id);
    if (!panel.title?.trim() || !panel.component || typeof panel.condition !== 'function') {
      throw new Error(
        `[PluginManager] Panel "${panel.id}" in "${manifest.id}" needs title, component, and condition.`,
      );
    }
  }
}

/**
 * Central plugin registry — discovers each plugins/{id}/manifest.ts via Vite glob.
 * Core UI imports only this module, never individual plugins.
 */
export class PluginManager implements PluginManagerApi {
  private readonly plugins = new Map<string, PluginManifest>();
  private initialized = false;

  register(manifest: PluginManifest): void {
    validateManifest(manifest);
    if (this.plugins.has(manifest.id)) {
      throw new Error(`[PluginManager] Plugin "${manifest.id}" is already registered.`);
    }
    this.plugins.set(manifest.id, manifest);
  }

  getPlugin(id: string): PluginManifest | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): PluginManifest[] {
    return [...this.plugins.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  getToolbarEntries(): PluginToolbarEntry[] {
    const entries: PluginToolbarEntry[] = [];
    for (const manifest of this.plugins.values()) {
      for (const tool of manifest.tools ?? []) {
        entries.push({
          kind: 'plugin-tool',
          pluginId: manifest.id,
          id: tool.id,
          icon: tool.icon,
          label: tool.label,
          shortcut: tool.shortcut,
          digit: tool.digit,
          order: tool.order ?? 100,
        });
      }
    }
    return entries.sort((a, b) => a.order - b.order);
  }

  getPropertyPanelsForSelection(selection: PluginSelectionContext): Array<{
    pluginId: string;
    panel: PluginPropertiesPanelDefinition;
  }> {
    const matched: Array<{
      pluginId: string;
      panel: PluginPropertiesPanelDefinition;
      order: number;
    }> = [];

    for (const manifest of this.plugins.values()) {
      for (const panel of manifest.propertiesPanels ?? []) {
        try {
          if (panel.condition(selection)) {
            matched.push({
              pluginId: manifest.id,
              panel,
              order: panel.order ?? 100,
            });
          }
        } catch (err) {
          console.error(`[PluginManager] Panel "${panel.id}" condition failed:`, err);
        }
      }
    }

    return matched
      .sort((a, b) => a.order - b.order)
      .map(({ pluginId, panel }) => ({ pluginId, panel }));
  }

  findTool(pluginId: string, toolId: string): PluginToolDefinition | undefined {
    const manifest = this.plugins.get(pluginId);
    return manifest?.tools?.find((t) => t.id === toolId);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    for (const manifest of this.plugins.values()) {
      if (manifest.initHook) {
        await manifest.initHook(this);
      }
    }
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const pluginManager = new PluginManager();

const manifestModules = import.meta.glob<{ pluginManifest: PluginManifest }>(
  './*/manifest.ts',
  { eager: true },
);

for (const modulePath of Object.keys(manifestModules)) {
  const mod = manifestModules[modulePath];
  if (!mod?.pluginManifest) {
    throw new Error(
      `[PluginManager] ${modulePath} must export \`pluginManifest\` (PluginManifest).`,
    );
  }
  pluginManager.register(mod.pluginManifest);
}

if (import.meta.env.DEV) {
  const count = pluginManager.getAllPlugins().length;
  console.info(`[DVAMOCLES] Discovered ${count} plugin(s):`, pluginManager.getAllPlugins().map((p) => p.id));
}

export function initializePlugins(): Promise<void> {
  return pluginManager.initialize();
}

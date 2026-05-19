import { Highlighter } from 'lucide-react';
import type { PluginManifest } from '../types';
import { ExamplePluginPanel } from './ExamplePluginPanel';

const GEOMETRIC_TYPES = new Set(['rectangle', 'ellipse', 'diamond', 'line', 'arrow']);

export const pluginManifest: PluginManifest = {
  id: 'example',
  name: 'Example Highlight',
  version: '1.0.0',
  tools: [
    {
      id: 'plugin:example-highlight',
      label: 'Highlight',
      shortcut: 'X',
      icon: Highlighter,
      order: 50,
      onActivate: ({ engine }) => {
        engine.setActiveTool('plugin:example-highlight');
      },
    },
  ],
  propertiesPanels: [
    {
      id: 'example-highlight-panel',
      title: 'Highlight Plugin',
      component: ExamplePluginPanel,
      order: 200,
      condition: (selection) =>
        selection.activeTool === 'plugin:example-highlight' ||
        selection.selectedEntities.some((entity) => GEOMETRIC_TYPES.has(entity.type)),
    },
  ],
  initHook: (manager) => {
    if (import.meta.env.DEV) {
      const plugin = manager.getPlugin('example');
      console.info(`[DVAMOCLES] Plugin init: ${plugin?.name} v${plugin?.version}`);
    }
  },
};

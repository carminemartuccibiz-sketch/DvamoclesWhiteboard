import { Container, Graphics } from 'pixi.js';
import type { Viewport } from 'pixi-viewport';
import type { BoardEntity } from '../../lib/state/schema';
import { renderEntityGraphics } from './entityDraw';

export interface PreviewLayerHandle {
  show: (entity: BoardEntity | null) => void;
  destroy: () => void;
}

export function mountPreviewLayer(viewport: Viewport): PreviewLayerHandle {
  const layer = new Container();
  layer.label = 'preview';
  const g = new Graphics();
  layer.addChild(g);
  viewport.addChild(layer);

  return {
    show(entity: BoardEntity | null) {
      g.clear();
      if (!entity) return;
      renderEntityGraphics(g, entity, { preview: true });
    },
    destroy() {
      layer.destroy({ children: true });
    },
  };
}

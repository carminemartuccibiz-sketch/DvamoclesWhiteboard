import { Assets, Container, Graphics, Sprite, type Texture } from 'pixi.js';
import type { Viewport } from 'pixi-viewport';
import type { ImageEntity } from '../../lib/state/schema';
import { drawSelectionOutline } from './entityDraw';

export interface ImageSpritesHandle {
  syncEntity: (entity: ImageEntity, selected: boolean, visible: boolean) => void;
  removeEntity: (id: string) => void;
  clearAll: () => void;
  destroy: () => void;
}

export function mountImageSprites(viewport: Viewport): ImageSpritesHandle {
  const layer = new Container();
  layer.label = 'image-sprites';
  viewport.addChild(layer);

  const selectionLayer = new Container();
  selectionLayer.label = 'image-selection';
  viewport.addChild(selectionLayer);

  const spritesById = new Map<string, Sprite>();
  const selectionById = new Map<string, Graphics>();
  const loadedSrcById = new Map<string, string>();
  const textureCache = new Map<string, Promise<Texture>>();

  const loadTexture = (src: string): Promise<Texture> => {
    let pending = textureCache.get(src);
    if (!pending) {
      pending = Assets.load(src);
      textureCache.set(src, pending);
    }
    return pending;
  };

  const syncEntity = (entity: ImageEntity, selected: boolean, visible: boolean) => {
    void (async () => {
      let sprite = spritesById.get(entity.id);
      if (!sprite) {
        sprite = new Sprite();
        sprite.eventMode = 'none';
        spritesById.set(entity.id, sprite);
        layer.addChild(sprite);
      }

      if (loadedSrcById.get(entity.id) !== entity.src) {
        try {
          sprite.texture = await loadTexture(entity.src);
          loadedSrcById.set(entity.id, entity.src);
        } catch {
          sprite.visible = false;
          return;
        }
      }

      sprite.x = entity.x;
      sprite.y = entity.y;
      sprite.width = entity.width;
      sprite.height = entity.height;
      sprite.alpha = entity.style.opacity;
      sprite.visible = visible;

      const sel = selectionById.get(entity.id);
      if (selected && visible) {
        const outline = sel ?? new Graphics();
        if (!sel) {
          selectionById.set(entity.id, outline);
          selectionLayer.addChild(outline);
        }
        drawSelectionOutline(outline, entity);
        outline.visible = true;
      } else if (sel) {
        sel.clear();
        sel.visible = false;
      }
    })();
  };

  const removeEntity = (id: string) => {
    loadedSrcById.delete(id);
    const sprite = spritesById.get(id);
    if (sprite) {
      sprite.parent?.removeChild(sprite);
      sprite.destroy();
      spritesById.delete(id);
    }
    const sel = selectionById.get(id);
    if (sel) {
      sel.parent?.removeChild(sel);
      sel.destroy();
      selectionById.delete(id);
    }
  };

  return {
    syncEntity,
    removeEntity,
    clearAll: () => {
      for (const id of [...spritesById.keys()]) removeEntity(id);
    },
    destroy: () => {
      for (const id of [...spritesById.keys()]) removeEntity(id);
      layer.destroy({ children: true });
      selectionLayer.destroy({ children: true });
    },
  };
};

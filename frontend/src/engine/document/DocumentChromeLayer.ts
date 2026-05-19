import { Container, Graphics, Text } from 'pixi.js';
import type { Viewport } from 'pixi-viewport';
import type { DocumentNodeEntity } from '../../lib/state/schema';
import { DOCUMENT_CHROME } from '../../lib/document/documentLayout';
import type { RenderManager } from '../render/RenderManager';
import type { LodState } from '../render/lodPolicy';

function drawDocumentChrome(g: Graphics, entity: DocumentNodeEntity, selected: boolean): void {
  g.clear();
  g.roundRect(entity.x, entity.y, entity.width, entity.height, 8);
  g.fill({ color: 0x0c0c10, alpha: 0.94 });
  g.stroke({
    color: selected ? 0x2f80ed : 0x3f3f46,
    width: selected ? 2 : 1,
    alpha: 0.95,
  });

  g.rect(entity.x, entity.y + DOCUMENT_CHROME.headerHeight - 1, entity.width, 1);
  g.fill({ color: 0x27272a, alpha: 1 });
}

function drawGreekingPlaceholder(g: Graphics, entity: DocumentNodeEntity): void {
  g.clear();
  g.roundRect(entity.x, entity.y, entity.width, entity.height, 8);
  g.fill({ color: 0x18181b, alpha: 0.96 });
  g.stroke({ color: 0x3f3f46, width: 1, alpha: 0.7 });

  const bodyTop = entity.y + DOCUMENT_CHROME.headerHeight + 12;
  const innerW = entity.width - DOCUMENT_CHROME.paddingX * 2;
  let y = bodyTop;
  const barH = 8;
  const gap = 10;

  for (let i = 0; i < Math.min(entity.blocks.length, 12); i += 1) {
    const block = entity.blocks[i]!;
    const w = innerW * (block.kind === 'heading' ? 0.55 : block.kind === 'code' ? 0.9 : 0.75);
    const h = block.kind === 'heading' ? 12 : barH;
    g.roundRect(entity.x + DOCUMENT_CHROME.paddingX, y, w, h, 3);
    g.fill({ color: 0x3f3f46, alpha: 0.55 });
    y += h + gap;
    if (y > entity.y + entity.height - 16) break;
  }
}

export interface DocumentChromeLayerHandle {
  sync: (entities: DocumentNodeEntity[], selectedIds: ReadonlySet<string>) => void;
  destroy: () => void;
}

export function mountDocumentChromeLayer(
  viewport: Viewport,
  renderManager: RenderManager,
): DocumentChromeLayerHandle {
  const layer = new Container();
  layer.label = 'document-chrome';
  viewport.addChild(layer);

  const frames = new Map<string, Graphics>();
  const greeking = new Map<string, Graphics>();
  const titles = new Map<string, Text>();

  let currentLod: LodState = renderManager.getLod();
  let lastEntities: DocumentNodeEntity[] = [];
  let lastSelected = new Set<string>();

  const applyVisibility = (entity: DocumentNodeEntity, selectedIds: ReadonlySet<string>) => {
    const frame = frames.get(entity.id);
    const greek = greeking.get(entity.id);
    const title = titles.get(entity.id);
    if (!frame) return;

    const inView = renderManager.isEntityVisible(entity.id, selectedIds);
    frame.visible = inView && currentLod.showDocumentText;
    if (greek) greek.visible = inView && !currentLod.showDocumentText;
    if (title) title.visible = inView && currentLod.showDocumentText;
  };

  const sync = (entities: DocumentNodeEntity[], selectedIds: ReadonlySet<string>) => {
    lastEntities = entities;
    lastSelected = new Set(selectedIds);

    const live = new Set(entities.map((e) => e.id));
    for (const id of frames.keys()) {
      if (!live.has(id)) {
        frames.get(id)?.destroy();
        greeking.get(id)?.destroy();
        titles.get(id)?.destroy();
        frames.delete(id);
        greeking.delete(id);
        titles.delete(id);
      }
    }

    for (const entity of entities) {
      renderManager.upsertEntity(entity);

      let frame = frames.get(entity.id);
      if (!frame) {
        frame = new Graphics();
        frames.set(entity.id, frame);
        layer.addChild(frame);
      }

      let greek = greeking.get(entity.id);
      if (!greek) {
        greek = new Graphics();
        greeking.set(entity.id, greek);
        layer.addChild(greek);
      }

      if (currentLod.showDocumentText) {
        drawDocumentChrome(frame, entity, selectedIds.has(entity.id));
        greek.clear();
      } else {
        frame.clear();
        drawGreekingPlaceholder(greek, entity);
      }

      let title = titles.get(entity.id);
      if (!title) {
        title = new Text({
          text: '',
          style: {
            fill: 0xa1a1aa,
            fontSize: 11,
            fontFamily: 'ui-monospace, monospace',
            fontWeight: '600',
          },
        });
        titles.set(entity.id, title);
        layer.addChild(title);
      }
      title.text = entity.title || entity.sourceFileName || 'Document';
      title.x = entity.x + DOCUMENT_CHROME.paddingX;
      title.y = entity.y + 10;

      applyVisibility(entity, selectedIds);
    }
  };

  const unsubCull = renderManager.subscribe(({ lod }) => {
    currentLod = lod;
    sync(lastEntities, lastSelected);
  });

  return {
    sync,
    destroy() {
      unsubCull();
      layer.destroy({ children: true });
      frames.clear();
      greeking.clear();
      titles.clear();
    },
  };
}

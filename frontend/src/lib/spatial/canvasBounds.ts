import type { BoardEntity } from '../state/schema';
import type { Bounds } from '../../engine/EngineContext';

const PAD = 48;

export function computeEntitiesBounds(entities: BoardEntity[]): Bounds | null {
  if (entities.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const entity of entities) {
    minX = Math.min(minX, entity.x);
    minY = Math.min(minY, entity.y);
    maxX = Math.max(maxX, entity.x + entity.width);
    maxY = Math.max(maxY, entity.y + entity.height);

    if (entity.type === 'line' || entity.type === 'arrow') {
      minX = Math.min(minX, entity.endX);
      minY = Math.min(minY, entity.endY);
      maxX = Math.max(maxX, entity.endX);
      maxY = Math.max(maxY, entity.endY);
    }

    if (entity.type === 'freehand') {
      for (let i = 0; i < entity.points.length; i += 2) {
        minX = Math.min(minX, entity.points[i]!);
        minY = Math.min(minY, entity.points[i + 1]!);
        maxX = Math.max(maxX, entity.points[i]!);
        maxY = Math.max(maxY, entity.points[i + 1]!);
      }
    }
  }

  return {
    minX: minX - PAD,
    minY: minY - PAD,
    maxX: maxX + PAD,
    maxY: maxY + PAD,
  };
}

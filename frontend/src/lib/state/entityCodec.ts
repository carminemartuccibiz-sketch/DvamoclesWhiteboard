import * as Y from 'yjs';
import {
  cloneEntity,
  isBoardEntity,
  mergeEntityPatch,
  normalizeDocumentEntity,
  normalizeEntityStyle,
  type BoardEntity,
  type BoardEntityPatch,
  type EntityStyle,
  type SpatialLink,
} from './schema';

function readStyle(raw: unknown): EntityStyle | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (
    typeof s.strokeColor !== 'string' ||
    typeof s.fillColor !== 'string' ||
    typeof s.fillMode !== 'string' ||
    typeof s.strokeWidth !== 'number' ||
    typeof s.strokeStyle !== 'string' ||
    typeof s.opacity !== 'number' ||
    typeof s.sloppiness !== 'number'
  ) {
    return null;
  }
  return normalizeEntityStyle({
    strokeColor: s.strokeColor,
    fillColor: s.fillColor,
    fillMode:
      (s.fillMode as EntityStyle['fillMode']) ??
      (s.fillColor === 'none' || s.fillColor === 'transparent' ? 'none' : 'solid'),
    strokeWidth: s.strokeWidth,
    strokeStyle: s.strokeStyle as EntityStyle['strokeStyle'],
    opacity: s.opacity,
    sloppiness: s.sloppiness,
  });
}

/** Decode a Yjs-stored value (Y.Map or plain object) into a typed entity */
export function entityFromYValue(raw: unknown): BoardEntity | null {
  if (raw instanceof Y.Map) {
    const plain: Record<string, unknown> = {};
    raw.forEach((value, key) => {
      if (key === 'style' && value instanceof Y.Map) {
        const style: Record<string, unknown> = {};
        value.forEach((sv, sk) => {
          style[sk] = sv;
        });
        plain.style = style;
      } else if (key === 'points' && Array.isArray(value)) {
        plain.points = [...value];
      } else if (key === 'blocks' && Array.isArray(value)) {
        plain.blocks = value.map((b) => ({ ...(b as object) }));
      } else {
        plain[key] = value;
      }
    });
    if (!isBoardEntity(plain)) return null;
    if (plain.type === 'document') return cloneEntity(normalizeDocumentEntity(plain as never));
    return cloneEntity(plain);
  }

  if (!raw || typeof raw !== 'object') return null;
  const record = { ...(raw as Record<string, unknown>) };
  if (record.style && typeof record.style === 'object') {
    const style = readStyle(record.style);
    if (!style) return null;
    record.style = style;
  }
  if (record.type === 'freehand' && Array.isArray(record.points)) {
    record.points = [...record.points];
  }
  if (!isBoardEntity(record)) return null;
  if (record.type === 'document') return cloneEntity(normalizeDocumentEntity(record as never));
  return cloneEntity(record);
}

export function spatialLinkFromYValue(raw: unknown): SpatialLink | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.sourceDocumentId !== 'string') return null;
  if (typeof r.targetShapeId !== 'string' || !Array.isArray(r.charRange)) return null;
  const range = r.charRange as unknown[];
  if (range.length !== 2 || typeof range[0] !== 'number' || typeof range[1] !== 'number') return null;
  return {
    id: r.id,
    sourceDocumentId: r.sourceDocumentId,
    charRange: [range[0], range[1]],
    targetShapeId: r.targetShapeId,
    label: typeof r.label === 'string' ? r.label : undefined,
  };
}

export function spatialLinkToYValue(link: SpatialLink): Record<string, unknown> {
  return {
    id: link.id,
    sourceDocumentId: link.sourceDocumentId,
    charRange: [...link.charRange],
    targetShapeId: link.targetShapeId,
    label: link.label,
  };
}

/** Encode entity for Y.Map storage (plain JSON-safe object) */
export function entityToYValue(entity: BoardEntity): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: entity.id,
    type: entity.type,
    x: entity.x,
    y: entity.y,
    width: entity.width,
    height: entity.height,
    style: { ...entity.style },
  };

  switch (entity.type) {
    case 'rectangle':
      if (entity.cornerRadius) base.cornerRadius = entity.cornerRadius;
      if (entity.variant && entity.variant !== 'rectangle') base.variant = entity.variant;
      break;
    case 'line':
      base.endX = entity.endX;
      base.endY = entity.endY;
      break;
    case 'arrow':
      base.endX = entity.endX;
      base.endY = entity.endY;
      base.arrowheadStart = entity.arrowheadStart ?? 'none';
      base.arrowheadEnd = entity.arrowheadEnd ?? 'triangle';
      break;
    case 'freehand':
      base.points = [...entity.points];
      break;
    case 'document':
      base.title = entity.title;
      base.plainText = entity.plainText;
      base.content = entity.content;
      base.blocks = entity.blocks.map((b) => ({ ...b }));
      base.scrollY = entity.scrollY;
      base.sourceFileName = entity.sourceFileName;
      base.fontSize = entity.fontSize;
      base.fontFamily = entity.fontFamily;
      break;
    case 'image':
      base.src = entity.src;
      base.naturalWidth = entity.naturalWidth;
      base.naturalHeight = entity.naturalHeight;
      base.fileName = entity.fileName;
      break;
    default:
      break;
  }

  return base;
}

export function applyPatchToYMap(ymap: Y.Map<unknown>, patch: BoardEntityPatch): void {
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'style' && value && typeof value === 'object') {
      let styleMap = ymap.get('style');
      if (!(styleMap instanceof Y.Map)) {
        styleMap = new Y.Map<unknown>();
        ymap.set('style', styleMap);
      }
      const styleYMap = styleMap as Y.Map<unknown>;
      for (const [sk, sv] of Object.entries(value as Partial<EntityStyle>)) {
        if (sv !== undefined) styleYMap.set(sk, sv);
      }
      continue;
    }
    if (key === 'points' && Array.isArray(value)) {
      ymap.set('points', [...value]);
      continue;
    }
    if (value !== undefined) ymap.set(key, value);
  }
}

export function ensureYEntityMap(
  entities: Y.Map<unknown>,
  id: string,
  factory: () => BoardEntity,
): Y.Map<unknown> {
  let yEntity = entities.get(id);
  if (!(yEntity instanceof Y.Map)) {
    const created = factory();
    entities.set(id, entityToYValue(created));
    yEntity = entities.get(id);
  }
  if (!(yEntity instanceof Y.Map)) {
    throw new Error(`Failed to create Y.Map for entity ${id}`);
  }
  return yEntity;
}

export function readEntityFromStore(entities: Y.Map<unknown>, id: string): BoardEntity | null {
  return entityFromYValue(entities.get(id));
}

export function mergePatchInStore(
  entities: Y.Map<unknown>,
  id: string,
  patch: BoardEntityPatch,
): BoardEntity | null {
  const current = readEntityFromStore(entities, id);
  if (!current) return null;
  const merged = mergeEntityPatch(current, patch);
  entities.set(id, entityToYValue(merged));
  return merged;
}

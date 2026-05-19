import type { DvColorStyle, DvDashStyle, DvFillStyle } from '../../contracts/styles';

/** Current on-disk / API document schema generation */
export const DOCUMENT_SCHEMA_VERSION = 3 as const;

export type DocumentSchemaVersion = typeof DOCUMENT_SCHEMA_VERSION;

export type EntityType =
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'freehand'
  | 'document'
  | 'image';

export type StrokeStyleKind = 'solid' | 'dashed' | 'dotted';

/**
 * System-agnostic visual style bag shared by every canvas entity.
 * Colors use engine palette ids (`DvColorStyle`) or `none` / `transparent` for fills.
 */
export interface EntityStyle {
  strokeColor: DvColorStyle | string;
  fillColor: DvColorStyle | 'none' | 'transparent' | string;
  /** Independent from sloppiness — controls area fill only */
  fillMode: DvFillStyle;
  strokeWidth: number;
  strokeStyle: StrokeStyleKind;
  opacity: number;
  /** 0 = geometric precision, 1 = maximum hand-drawn jitter (stroke only) */
  sloppiness: number;
}

export interface EntityBase {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  width: number;
  height: number;
  style: EntityStyle;
}

export interface RectangleEntity extends EntityBase {
  type: 'rectangle';
  cornerRadius?: number;
  variant?: 'rectangle' | 'diamond';
}

export interface EllipseEntity extends EntityBase {
  type: 'ellipse';
}

/** Straight segment from (x, y) to (endX, endY) in world space */
export interface LineEntity extends EntityBase {
  type: 'line';
  endX: number;
  endY: number;
}

export type ArrowheadStyle = 'triangle' | 'dot' | 'bar';

export interface ArrowEntity extends EntityBase {
  type: 'arrow';
  endX: number;
  endY: number;
  arrowheadStart?: ArrowheadStyle | 'none';
  arrowheadEnd?: ArrowheadStyle | 'none';
}

/** Polyline in world space — flat [x0, y0, x1, y1, …] */
export interface FreehandDrawEntity extends EntityBase {
  type: 'freehand';
  points: number[];
}

export type DocumentBlockKind = 'paragraph' | 'heading' | 'list-item' | 'code';

export interface DocumentBlock {
  id: string;
  kind: DocumentBlockKind;
  text: string;
  level?: number;
}

/** Bidirectional text ↔ shape mapping (Spatial Graal) */
export interface SpatialLink {
  id: string;
  sourceDocumentId: string;
  charRange: [number, number];
  targetShapeId: string;
  label?: string;
}

export interface DocumentNodeEntity extends EntityBase {
  type: 'document';
  title: string;
  plainText: string;
  blocks: DocumentBlock[];
  scrollY: number;
  /** @deprecated Use plainText — kept for backward compatibility */
  content: string;
  sourceFileName?: string;
  fontSize: number;
  fontFamily?: string;
}

/** Raster asset (data URL or remote URL) placed on the canvas */
export interface ImageEntity extends EntityBase {
  type: 'image';
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  fileName?: string;
}

export type BoardEntity =
  | RectangleEntity
  | EllipseEntity
  | LineEntity
  | ArrowEntity
  | FreehandDrawEntity
  | DocumentNodeEntity
  | ImageEntity;

export type BoardEntityPatch = Partial<Omit<BoardEntity, 'id' | 'type'>> & {
  style?: Partial<EntityStyle>;
  points?: number[];
};

export interface DvWorldDocument {
  schemaVersion: DocumentSchemaVersion;
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
  entities: Record<string, BoardEntity>;
  spatialLinks: SpatialLink[];
  meta: {
    savedAt: string;
    projectName?: string;
    /** Set when imported from a legacy engine (e.g. tldraw) */
    migratedFrom?: string;
  };
}

export const DEFAULT_ENTITY_STYLE: EntityStyle = {
  strokeColor: 'black',
  fillColor: 'none',
  fillMode: 'none',
  strokeWidth: 2,
  strokeStyle: 'solid',
  opacity: 1,
  sloppiness: 0,
};

export function createEntityId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ent_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function normalizeEntityStyle(partial?: Partial<EntityStyle>): EntityStyle {
  return {
    ...DEFAULT_ENTITY_STYLE,
    ...partial,
    strokeColor: partial?.strokeColor ?? DEFAULT_ENTITY_STYLE.strokeColor,
    fillColor: partial?.fillColor ?? DEFAULT_ENTITY_STYLE.fillColor,
    fillMode: partial?.fillMode ?? DEFAULT_ENTITY_STYLE.fillMode,
    strokeWidth: clamp(partial?.strokeWidth ?? DEFAULT_ENTITY_STYLE.strokeWidth, 0.5, 64),
    strokeStyle: partial?.strokeStyle ?? DEFAULT_ENTITY_STYLE.strokeStyle,
    opacity: clamp(partial?.opacity ?? DEFAULT_ENTITY_STYLE.opacity, 0, 1),
    sloppiness: clamp(partial?.sloppiness ?? DEFAULT_ENTITY_STYLE.sloppiness, 0, 1),
  };
}

export function dashStyleToStrokeStyle(dash: DvDashStyle): StrokeStyleKind {
  if (dash === 'dashed') return 'dashed';
  if (dash === 'dotted' || dash === 'draw') return 'dotted';
  return 'solid';
}

export function strokeStyleToDashStyle(stroke: StrokeStyleKind): DvDashStyle {
  if (stroke === 'dashed') return 'dashed';
  if (stroke === 'dotted') return 'dotted';
  return 'solid';
}

export function sloppinessUiToValue(ui: 'straight' | 'sketchy'): number {
  return ui === 'sketchy' ? 1 : 0;
}

export function sloppinessValueToUi(value: number): 'straight' | 'sketchy' {
  return value >= 0.5 ? 'sketchy' : 'straight';
}

export function createRectangleEntity(
  partial: Omit<RectangleEntity, 'id' | 'type' | 'style'> & {
    id?: string;
    style?: Partial<EntityStyle>;
    variant?: 'rectangle' | 'diamond';
  },
): RectangleEntity {
  return {
    id: partial.id ?? createEntityId(),
    type: 'rectangle',
    x: partial.x,
    y: partial.y,
    width: partial.width,
    height: partial.height,
    cornerRadius: partial.cornerRadius ?? 0,
    variant: partial.variant ?? 'rectangle',
    style: normalizeEntityStyle(partial.style),
  };
}

export function createEllipseEntity(
  partial: Omit<EllipseEntity, 'id' | 'type' | 'style'> & {
    id?: string;
    style?: Partial<EntityStyle>;
  },
): EllipseEntity {
  return {
    id: partial.id ?? createEntityId(),
    type: 'ellipse',
    x: partial.x,
    y: partial.y,
    width: partial.width,
    height: partial.height,
    style: normalizeEntityStyle(partial.style),
  };
}

export function createLineEntity(
  partial: Omit<LineEntity, 'id' | 'type' | 'style'> & {
    id?: string;
    style?: Partial<EntityStyle>;
  },
): LineEntity {
  const width = partial.width ?? Math.abs(partial.endX - partial.x);
  const height = partial.height ?? Math.abs(partial.endY - partial.y);
  return {
    id: partial.id ?? createEntityId(),
    type: 'line',
    x: partial.x,
    y: partial.y,
    width,
    height,
    endX: partial.endX,
    endY: partial.endY,
    style: normalizeEntityStyle(partial.style),
  };
}

export function createArrowEntity(
  partial: Omit<ArrowEntity, 'id' | 'type' | 'style'> & {
    id?: string;
    style?: Partial<EntityStyle>;
  },
): ArrowEntity {
  const width = partial.width ?? Math.abs(partial.endX - partial.x);
  const height = partial.height ?? Math.abs(partial.endY - partial.y);
  return {
    id: partial.id ?? createEntityId(),
    type: 'arrow',
    x: partial.x,
    y: partial.y,
    width,
    height,
    endX: partial.endX,
    endY: partial.endY,
    arrowheadStart: partial.arrowheadStart ?? 'none',
    arrowheadEnd: partial.arrowheadEnd ?? 'triangle',
    style: normalizeEntityStyle(partial.style),
  };
}

export function createFreehandEntity(
  partial: Omit<FreehandDrawEntity, 'id' | 'type' | 'style'> & {
    id?: string;
    style?: Partial<EntityStyle>;
  },
): FreehandDrawEntity {
  return {
    id: partial.id ?? createEntityId(),
    type: 'freehand',
    x: partial.x,
    y: partial.y,
    width: partial.width,
    height: partial.height,
    points: [...partial.points],
    style: normalizeEntityStyle(partial.style),
  };
}

export function createImageEntity(
  partial: Omit<ImageEntity, 'id' | 'type' | 'style'> & {
    id?: string;
    style?: Partial<EntityStyle>;
  },
): ImageEntity {
  return {
    id: partial.id ?? createEntityId(),
    type: 'image',
    x: partial.x,
    y: partial.y,
    width: partial.width,
    height: partial.height,
    src: partial.src,
    naturalWidth: partial.naturalWidth,
    naturalHeight: partial.naturalHeight,
    fileName: partial.fileName,
    style: normalizeEntityStyle({
      fillMode: 'none',
      ...partial.style,
    }),
  };
}

export function createDocumentNodeEntity(
  partial: Omit<DocumentNodeEntity, 'id' | 'type' | 'style'> & {
    id?: string;
    style?: Partial<EntityStyle>;
    content?: string;
  },
): DocumentNodeEntity {
  const plainText = partial.plainText ?? partial.content ?? '';
  return {
    id: partial.id ?? createEntityId(),
    type: 'document',
    x: partial.x,
    y: partial.y,
    width: partial.width,
    height: partial.height,
    title: partial.title ?? 'Document',
    plainText,
    content: plainText,
    blocks: partial.blocks ?? [{ id: 'blk_0', kind: 'paragraph', text: plainText, level: 0 }],
    scrollY: partial.scrollY ?? 0,
    sourceFileName: partial.sourceFileName,
    fontSize: partial.fontSize,
    fontFamily: partial.fontFamily ?? 'ui-sans-serif, system-ui, sans-serif',
    style: normalizeEntityStyle(partial.style),
  };
}

export function createSpatialLink(
  partial: Omit<SpatialLink, 'id'> & { id?: string },
): SpatialLink {
  return {
    id: partial.id ?? createEntityId(),
    sourceDocumentId: partial.sourceDocumentId,
    charRange: partial.charRange,
    targetShapeId: partial.targetShapeId,
    label: partial.label,
  };
}

export function normalizeDocumentEntity(entity: DocumentNodeEntity): DocumentNodeEntity {
  const plainText = entity.plainText || entity.content || '';
  return {
    ...entity,
    plainText,
    content: plainText,
    title: entity.title ?? 'Document',
    blocks:
      entity.blocks?.length > 0
        ? entity.blocks
        : [{ id: 'blk_0', kind: 'paragraph', text: plainText, level: 0 }],
    scrollY: entity.scrollY ?? 0,
  };
}

export function isBoardEntity(value: unknown): value is BoardEntity {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.type !== 'string') return false;
  if (
    typeof record.x !== 'number' ||
    typeof record.y !== 'number' ||
    typeof record.width !== 'number' ||
    typeof record.height !== 'number'
  ) {
    return false;
  }
  if (!record.style || typeof record.style !== 'object') return false;
  const style = record.style as Record<string, unknown>;
  if (
    typeof style.strokeColor !== 'string' ||
    typeof style.fillColor !== 'string' ||
    typeof style.fillMode !== 'string' ||
    typeof style.strokeWidth !== 'number' ||
    typeof style.strokeStyle !== 'string' ||
    typeof style.opacity !== 'number' ||
    typeof style.sloppiness !== 'number'
  ) {
    return false;
  }

  switch (record.type as EntityType) {
    case 'rectangle':
      return true; // variant optional
    case 'ellipse':
      return true;
    case 'line':
      return typeof record.endX === 'number' && typeof record.endY === 'number';
    case 'arrow':
      return typeof record.endX === 'number' && typeof record.endY === 'number';
    case 'freehand':
      return Array.isArray(record.points) && record.points.every((n) => typeof n === 'number');
    case 'document':
      return (
        typeof record.fontSize === 'number' &&
        (typeof record.plainText === 'string' ||
          typeof record.content === 'string')
      );
    case 'image':
      return (
        typeof record.src === 'string' &&
        typeof record.naturalWidth === 'number' &&
        typeof record.naturalHeight === 'number'
      );
    default:
      return false;
  }
}

export function cloneEntity(entity: BoardEntity): BoardEntity {
  if (entity.type === 'freehand') {
    return { ...entity, points: [...entity.points], style: { ...entity.style } };
  }
  if (entity.type === 'document') {
    return normalizeDocumentEntity({
      ...entity,
      blocks: entity.blocks.map((b) => ({ ...b })),
      style: { ...entity.style },
    });
  }
  if (entity.type === 'image') {
    return { ...entity, style: { ...entity.style } };
  }
  return { ...entity, style: { ...entity.style } };
}

export function mergeEntityPatch(entity: BoardEntity, patch: BoardEntityPatch): BoardEntity {
  const next = {
    ...entity,
    ...patch,
    style: normalizeEntityStyle({
      ...entity.style,
      ...patch.style,
    }),
  } as BoardEntity;

  if (entity.type === 'freehand' && patch.points) {
    (next as FreehandDrawEntity).points = [...patch.points];
  }

  return next;
}

export function recomputeBoundsFromPoints(points: number[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (points.length < 2) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < points.length; i += 2) {
    const px = points[i]!;
    const py = points[i + 1]!;
    minX = Math.min(minX, px);
    minY = Math.min(minY, py);
    maxX = Math.max(maxX, px);
    maxY = Math.max(maxY, py);
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

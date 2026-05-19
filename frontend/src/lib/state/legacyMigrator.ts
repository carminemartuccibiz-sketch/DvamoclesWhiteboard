import type { DvColorStyle, DvFillStyle } from '../../contracts/styles';
import {
  createEntityId,
  DOCUMENT_SCHEMA_VERSION,
  normalizeEntityStyle,
  recomputeBoundsFromPoints,
  type ArrowEntity,
  type BoardEntity,
  type DvWorldDocument,
  type EllipseEntity,
  type FreehandDrawEntity,
  type LineEntity,
  type RectangleEntity,
} from './schema';

/** Backend envelope written by FastAPI */
export interface BackendProjectRecord {
  id?: string;
  project_name?: string;
  schema_version?: number;
  document: unknown;
}

/** tldraw v2 persisted snapshot (editor.getSnapshot()) */
export interface TldrawStoreSnapshot {
  document?: {
    store?: Record<string, unknown>;
    schema?: { schemaVersion?: number; sequences?: Record<string, number> };
  };
  session?: {
    currentPageId?: string;
    pageStates?: Array<{
      pageId: string;
      camera?: { x: number; y: number; z: number };
    }>;
  };
}

const TLDRAW_SHAPE_PREFIX = 'com.tldraw.shape';

const TLDRAW_COLOR_IDS = new Set<string>([
  'black',
  'grey',
  'light-violet',
  'violet',
  'blue',
  'light-blue',
  'yellow',
  'orange',
  'green',
  'light-green',
  'light-red',
  'red',
  'white',
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mapColor(raw: unknown): DvColorStyle | string {
  if (typeof raw === 'string' && TLDRAW_COLOR_IDS.has(raw)) return raw as DvColorStyle;
  return 'black';
}

function mapFill(raw: unknown): DvFillStyle {
  if (raw === 'none' || raw === 'transparent') return 'none';
  if (raw === 'semi') return 'semi';
  if (raw === 'solid' || raw === 'fill') return 'solid';
  if (raw === 'pattern') return 'pattern';
  return 'none';
}

function mapStrokeWidth(size: unknown): number {
  switch (size) {
    case 's':
      return 1.5;
    case 'm':
      return 2.5;
    case 'l':
      return 4;
    case 'xl':
      return 6;
    default:
      return 2;
  }
}

function mapStrokeStyle(dash: unknown): 'solid' | 'dashed' | 'dotted' {
  if (dash === 'dashed') return 'dashed';
  if (dash === 'dotted') return 'dotted';
  return 'solid';
}

function mapSloppiness(dash: unknown, font: unknown): number {
  if (dash === 'draw' || font === 'draw') return 1;
  return 0;
}

function styleFromTldrawProps(props: Record<string, unknown>) {
  const dash = props.dash;
  const font = props.font;
  return normalizeEntityStyle({
    strokeColor: mapColor(props.color),
    fillColor: mapColor(props.fill ?? props.color),
    fillMode: mapFill(props.fill),
    strokeWidth: mapStrokeWidth(props.size),
    strokeStyle: mapStrokeStyle(dash),
    opacity: clamp01(asNumber(props.opacity, 1)),
    sloppiness: mapSloppiness(dash, font),
  });
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function shapeIdFromTldraw(id: string): string {
  if (id.startsWith('shape:')) return id.slice('shape:'.length);
  return id;
}

/** Detect tldraw store snapshots (v2) in any common wrapper shape */
export function isTldrawSnapshot(value: unknown): boolean {
  const store = extractTldrawStore(value);
  if (!store) return false;

  for (const record of Object.values(store)) {
    const rec = asRecord(record);
    if (!rec) continue;
    if (rec.typeName === 'shape') return true;
    if (typeof rec.type === 'string' && rec.typeName === 'shape') return true;
  }

  const schema = findTldrawSchema(value);
  if (schema?.sequences) {
    return Object.keys(schema.sequences).some((k) => k.startsWith(TLDRAW_SHAPE_PREFIX));
  }

  return false;
}

export function isDvWorldDocument(value: unknown): value is DvWorldDocument {
  const rec = asRecord(value);
  if (!rec) return false;
  if (typeof rec.schemaVersion !== 'number') return false;
  if (!rec.camera || typeof rec.camera !== 'object') return false;
  if (!rec.entities || typeof rec.entities !== 'object' || Array.isArray(rec.entities)) return false;
  return true;
}

export function isBackendProjectRecord(value: unknown): value is BackendProjectRecord {
  const rec = asRecord(value);
  return Boolean(rec && 'document' in rec);
}

function findTldrawSchema(value: unknown): { sequences?: Record<string, number> } | undefined {
  const paths = [
    asRecord(value)?.schema,
    asRecord(asRecord(value)?.document)?.schema,
    asRecord(asRecord(asRecord(value)?.document)?.document)?.schema,
  ];
  for (const schema of paths) {
    if (schema && typeof schema === 'object') {
      return schema as { sequences?: Record<string, number> };
    }
  }
  return undefined;
}

/** Pull the flat tldraw `store` map from nested save payloads */
export function extractTldrawStore(value: unknown): Record<string, unknown> | null {
  const rec = asRecord(value);
  if (!rec) return null;

  const direct = asRecord(rec.store);
  if (direct) return direct;

  const doc = asRecord(rec.document);
  if (doc) {
    const innerStore = asRecord(doc.store);
    if (innerStore) return innerStore;

    const nested = asRecord(doc.document);
    if (nested) {
      const deepStore = asRecord(nested.store);
      if (deepStore) return deepStore;
    }
  }

  return null;
}

function extractTldrawCamera(value: unknown): DvWorldDocument['camera'] {
  const rec = asRecord(value);
  const session = asRecord(rec?.session) ?? asRecord(asRecord(rec?.document)?.session);
  const pageStates = session?.pageStates;
  if (Array.isArray(pageStates) && pageStates.length > 0) {
    const first = asRecord(pageStates[0]);
    const cam = asRecord(first?.camera);
    if (cam) {
      return {
        x: asNumber(cam.x),
        y: asNumber(cam.y),
        zoom: asNumber(cam.z, 1),
      };
    }
  }
  return { x: 0, y: 0, zoom: 1 };
}

function collectTldrawShapes(store: Record<string, unknown>): Array<Record<string, unknown>> {
  const shapes: Array<Record<string, unknown>> = [];
  for (const record of Object.values(store)) {
    const rec = asRecord(record);
    if (!rec || rec.typeName !== 'shape') continue;
    shapes.push(rec);
  }
  return shapes;
}

function parseLinePoints(
  shape: Record<string, unknown>,
  props: Record<string, unknown>,
): { x: number; y: number; endX: number; endY: number } | null {
  const sx = asNumber(shape.x);
  const sy = asNumber(shape.y);

  const raw = props.points;
  if (Array.isArray(raw) && raw.length >= 2) {
    const a = asRecord(raw[0]);
    const b = asRecord(raw[raw.length - 1]);
    if (a && b) {
      return {
        x: sx + asNumber(a.x),
        y: sy + asNumber(a.y),
        endX: sx + asNumber(b.x),
        endY: sy + asNumber(b.y),
      };
    }
  }

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const handles = Object.values(raw as Record<string, unknown>)
      .map((h) => asRecord(h))
      .filter((h): h is Record<string, unknown> => Boolean(h))
      .sort((a, b) => String(a.index ?? a.id).localeCompare(String(b.index ?? b.id)));

    if (handles.length >= 2) {
      const a = handles[0]!;
      const b = handles[handles.length - 1]!;
      return {
        x: sx + asNumber(a.x),
        y: sy + asNumber(a.y),
        endX: sx + asNumber(b.x),
        endY: sy + asNumber(b.y),
      };
    }
  }

  return null;
}

function parseDrawPoints(shape: Record<string, unknown>, props: Record<string, unknown>): number[] {
  const sx = asNumber(shape.x);
  const sy = asNumber(shape.y);
  const segments = props.segments;
  const flat: number[] = [];

  if (Array.isArray(segments)) {
    for (const segment of segments) {
      const seg = asRecord(segment);
      if (!seg) continue;
      const pts = seg.points;
      if (!Array.isArray(pts)) continue;
      for (const pt of pts) {
        const p = asRecord(pt);
        if (!p) continue;
        flat.push(sx + asNumber(p.x), sy + asNumber(p.y));
      }
    }
  }

  if (flat.length >= 4) return flat;

  const legacy = props.points;
  if (Array.isArray(legacy)) {
    for (const pt of legacy) {
      const p = asRecord(pt);
      if (p) flat.push(sx + asNumber(p.x), sy + asNumber(p.y));
      else if (typeof pt === 'number') flat.push(pt);
    }
  }

  return flat;
}

function migrateGeoShape(
  shape: Record<string, unknown>,
  props: Record<string, unknown>,
): RectangleEntity | EllipseEntity | null {
  const geo = String(props.geo ?? 'rectangle');
  const w = Math.max(asNumber(props.w, 8), 1);
  const h = Math.max(asNumber(props.h, 8), 1);
  const x = asNumber(shape.x);
  const y = asNumber(shape.y);
  const style = styleFromTldrawProps(props);
  const id = shapeIdFromTldraw(String(shape.id ?? createEntityId()));

  if (geo === 'ellipse' || geo === 'oval') {
    return {
      id,
      type: 'ellipse',
      x,
      y,
      width: w,
      height: h,
      style,
    };
  }

  const variant: 'rectangle' | 'diamond' =
    geo === 'diamond' || geo === 'rhombus' ? 'diamond' : 'rectangle';

  return {
    id,
    type: 'rectangle',
    x,
    y,
    width: w,
    height: h,
    variant,
    style,
  };
}

function migrateDrawShape(shape: Record<string, unknown>, props: Record<string, unknown>): FreehandDrawEntity | null {
  const points = parseDrawPoints(shape, props);
  if (points.length < 4) return null;

  const bounds = recomputeBoundsFromPoints(points);
  const style = styleFromTldrawProps(props);

  return {
    id: shapeIdFromTldraw(String(shape.id ?? createEntityId())),
    type: 'freehand',
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    points,
    style,
  };
}

function migrateLineShape(
  shape: Record<string, unknown>,
  props: Record<string, unknown>,
  asArrow: boolean,
): LineEntity | ArrowEntity | null {
  const segment = parseLinePoints(shape, props);
  if (!segment) return null;

  const minX = Math.min(segment.x, segment.endX);
  const minY = Math.min(segment.y, segment.endY);
  const maxX = Math.max(segment.x, segment.endX);
  const maxY = Math.max(segment.y, segment.endY);
  const style = styleFromTldrawProps(props);
  const id = shapeIdFromTldraw(String(shape.id ?? createEntityId()));

  const base = {
    id,
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
    endX: segment.endX,
    endY: segment.endY,
    style,
  };

  if (asArrow) {
    return {
      ...base,
      type: 'arrow',
      arrowheadStart: props.arrowheadStart === 'none' ? 'none' : 'none',
      arrowheadEnd: props.arrowheadEnd === 'none' ? 'none' : 'triangle',
    };
  }

  return { ...base, type: 'line' };
}

function migrateShapeRecord(shape: Record<string, unknown>): BoardEntity | null {
  const type = String(shape.type ?? '');
  const props = asRecord(shape.props) ?? {};

  switch (type) {
    case 'geo':
      return migrateGeoShape(shape, props);
    case 'draw':
      return migrateDrawShape(shape, props);
    case 'line':
      return migrateLineShape(shape, props, false);
    case 'arrow':
      return migrateLineShape(shape, props, true);
    default:
      return null;
  }
}

/**
 * Convert a tldraw v2 snapshot (any nesting level) into a DVAMOCLES world document.
 */
export function migrateTldrawToWorldDocument(source: unknown): DvWorldDocument {
  const store = extractTldrawStore(source);
  if (!store) {
    throw new Error('Cannot migrate: tldraw store not found in payload');
  }

  const entities: Record<string, BoardEntity> = {};
  for (const shape of collectTldrawShapes(store)) {
    const entity = migrateShapeRecord(shape);
    if (entity) entities[entity.id] = entity;
  }

  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    camera: extractTldrawCamera(source),
    entities,
    spatialLinks: [],
    meta: {
      savedAt: new Date().toISOString(),
      projectName: asRecord(source)?.name as string | undefined,
      migratedFrom: 'tldraw',
    },
  };
}

/**
 * Normalize any on-disk/API payload into a DVAMOCLES world document.
 * Runs the legacy migrator when tldraw data is detected.
 */
export function normalizeProjectPayload(raw: unknown): {
  document: DvWorldDocument;
  projectName?: string;
  projectId?: string;
} {
  if (isDvWorldDocument(raw)) {
    return {
      document: raw,
      projectName: raw.meta?.projectName,
    };
  }

  if (isBackendProjectRecord(raw)) {
    const projectName = raw.project_name;
    const projectId = raw.id;
    const inner = raw.document;

    if (isDvWorldDocument(inner)) {
      return {
        document: inner,
        projectName: projectName ?? inner.meta?.projectName,
        projectId,
      };
    }

    if (isTldrawSnapshot(inner) || isTldrawSnapshot(raw)) {
      const document = migrateTldrawToWorldDocument(inner ?? raw);
      return {
        document: {
          ...document,
          meta: {
            ...document.meta,
            projectName: projectName ?? document.meta.projectName,
          },
        },
        projectName,
        projectId,
      };
    }
  }

  if (isTldrawSnapshot(raw)) {
    const document = migrateTldrawToWorldDocument(raw);
    return { document };
  }

  throw new Error('Unrecognized project file format (expected DVAMOCLES or tldraw snapshot)');
}

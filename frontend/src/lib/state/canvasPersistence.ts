import type { CameraState } from '../../engine/EngineContext';
import type { StoreManager } from './StoreManager';
import { normalizeProjectPayload } from './legacyMigrator';
import type { DvWorldDocument } from './schema';
import { DOCUMENT_SCHEMA_VERSION } from './schema';

export const API_BASE = 'http://127.0.0.1:8000';

export interface SaveProjectRequest {
  document: DvWorldDocument;
  project_name?: string;
  id?: string;
  schema_version?: number;
}

export interface SaveProjectResponse {
  id: string;
  path: string;
}

export interface LoadProjectResponse {
  id: string;
  project_name: string;
  schema_version?: number;
  document: unknown;
}

/**
 * Build a portable JSON document from the current Yjs world (entities + spatial links).
 */
export function serializeCanvasState(
  store: StoreManager,
  camera: CameraState,
  meta?: Partial<DvWorldDocument['meta']>,
): string {
  const document = store.exportWorldDocument(camera, meta);
  return JSON.stringify(document);
}

export function parseCanvasStateJson(json: string): DvWorldDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Project file is not valid JSON');
  }
  return normalizeProjectPayload(parsed).document;
}

export function buildSavePayload(
  store: StoreManager,
  camera: CameraState,
  options?: { projectName?: string; projectId?: string },
): SaveProjectRequest {
  const document = store.exportWorldDocument(camera, {
    projectName: options?.projectName,
  });

  return {
    document,
    project_name: options?.projectName,
    id: options?.projectId,
    schema_version: DOCUMENT_SCHEMA_VERSION,
  };
}

export async function saveProjectToBackend(
  store: StoreManager,
  camera: CameraState,
  options?: { projectName?: string; projectId?: string },
): Promise<SaveProjectResponse> {
  const payload = buildSavePayload(store, camera, options);

  const response = await fetch(`${API_BASE}/api/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Save failed (${response.status})${detail ? `: ${detail}` : ''}`);
  }

  return (await response.json()) as SaveProjectResponse;
}

export async function loadProjectFromBackend(projectId: string): Promise<{
  document: DvWorldDocument;
  projectName: string;
  projectId: string;
}> {
  const slug = encodeURIComponent(projectId);
  const response = await fetch(`${API_BASE}/api/load?project_id=${slug}`);

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Load failed (${response.status})${detail ? `: ${detail}` : ''}`);
  }

  const record = (await response.json()) as LoadProjectResponse;
  const normalized = normalizeProjectPayload(record);

  return {
    document: normalized.document,
    projectName: normalized.projectName ?? record.project_name ?? projectId,
    projectId: normalized.projectId ?? record.id ?? projectId,
  };
}

export function applyWorldDocumentToStore(
  store: StoreManager,
  document: DvWorldDocument,
  options?: { tracked?: boolean },
): void {
  store.importWorldDocument(
    {
      schemaVersion: document.schemaVersion ?? DOCUMENT_SCHEMA_VERSION,
      camera: document.camera,
      entities: document.entities ?? {},
      spatialLinks: document.spatialLinks ?? [],
      meta: document.meta ?? { savedAt: new Date().toISOString() },
    },
    options,
  );
}

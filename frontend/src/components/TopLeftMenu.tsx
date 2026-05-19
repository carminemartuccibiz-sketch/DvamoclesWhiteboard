/**
 * Top-left menu surface — save/load hooks and re-export of the main chrome bar.
 * Save posts DVAMOCLES JSON to POST http://127.0.0.1:8000/api/save
 */
export { TopBar, TopBar as TopLeftMenu } from './TopBar';
export { ExportMenuItems } from './ExportMenu';
export {
  API_BASE,
  applyWorldDocumentToStore,
  buildSavePayload,
  loadProjectFromBackend,
  parseCanvasStateJson,
  saveProjectToBackend,
  serializeCanvasState,
} from '../lib/state/canvasPersistence';
export {
  extractTldrawStore,
  isTldrawSnapshot,
  isDvWorldDocument,
  migrateTldrawToWorldDocument,
  normalizeProjectPayload,
} from '../lib/state/legacyMigrator';

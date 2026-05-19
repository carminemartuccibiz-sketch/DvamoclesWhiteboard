import type { Viewport } from 'pixi-viewport';
import type { StoreManager } from '../../lib/state/StoreManager';
import type { DocumentBlockKind, DocumentNodeEntity } from '../../lib/state/schema';
import { DOCUMENT_CHROME, layoutDocumentNode } from '../../lib/document/documentLayout';
import type { RenderManager } from '../render/RenderManager';
import type { LodState } from '../render/lodPolicy';

export interface PendingLinkSource {
  documentId: string;
  charRange: [number, number];
  excerpt: string;
}

export interface DocumentOverlayBridge {
  getSelectedIds(): ReadonlySet<string>;
  setSelection(ids: string[]): void;
  updateEntity(id: string, patch: Partial<DocumentNodeEntity>): void;
  beginGesture(id: string, entityIds: string[]): void;
  commitGesture(): void;
  applyGesturePreview(id: string, patch: Partial<DocumentNodeEntity>): DocumentNodeEntity | null;
  getPendingLinkSource(): PendingLinkSource | null;
  setPendingLinkSource(source: PendingLinkSource | null): void;
  getActiveTool(): string;
}

export interface DocumentOverlayHandle {
  syncAll(): void;
  destroy(): void;
}

const BLOCK_CLASS: Record<DocumentBlockKind, string> = {
  paragraph: 'dv-doc-p',
  heading: 'dv-doc-h',
  'list-item': 'dv-doc-li',
  code: 'dv-doc-code',
};

function blockTag(kind: DocumentBlockKind, level = 0): keyof HTMLElementTagNameMap {
  if (kind === 'heading') return level <= 1 ? 'h2' : 'h3';
  if (kind === 'list-item') return 'li';
  if (kind === 'code') return 'pre';
  return 'p';
}

function buildGreekingLayer(entity: DocumentNodeEntity): HTMLDivElement {
  const greeking = document.createElement('div');
  greeking.className = 'dv-document-greeking';
  greeking.style.marginTop = `${DOCUMENT_CHROME.headerHeight}px`;
  greeking.style.height = `calc(100% - ${DOCUMENT_CHROME.headerHeight}px)`;
  greeking.setAttribute('aria-hidden', 'true');

  for (const block of entity.blocks) {
    const bar = document.createElement('div');
    bar.className = 'dv-doc-greek-bar';
    if (block.kind === 'heading') bar.classList.add('dv-doc-greek-bar--heading');
    if (block.kind === 'code') bar.classList.add('dv-doc-greek-bar--code');
    greeking.appendChild(bar);
  }

  return greeking;
}

function applyLodToShell(shell: HTMLDivElement, lod: LodState): void {
  const body = shell.querySelector<HTMLElement>('.dv-document-body');
  const greeking = shell.querySelector<HTMLElement>('.dv-document-greeking');
  if (!body || !greeking) return;

  if (lod.showDocumentText) {
    body.style.display = '';
    body.style.visibility = 'visible';
    greeking.style.display = 'none';
    shell.classList.remove('dv-document-shell--greeked');
  } else {
    body.style.display = 'none';
    body.style.visibility = 'hidden';
    greeking.style.display = 'flex';
    shell.classList.add('dv-document-shell--greeked');
  }
}

export function mountDocumentOverlayManager(
  container: HTMLElement,
  viewport: Viewport,
  store: StoreManager,
  bridge: DocumentOverlayBridge,
  renderManager: RenderManager,
): DocumentOverlayHandle {
  const root = document.createElement('div');
  root.className = 'dv-document-overlay-root';
  root.style.cssText =
    'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2;';
  container.appendChild(root);

  const shells = new Map<string, HTMLDivElement>();
  let currentLod: LodState = renderManager.getLod();

  const worldToScreen = (wx: number, wy: number) => {
    const p = viewport.toScreen(wx, wy);
    return { x: p.x, y: p.y };
  };

  const syncShellPosition = (entity: DocumentNodeEntity, shell: HTMLDivElement) => {
    const tl = worldToScreen(entity.x, entity.y);
    const br = worldToScreen(entity.x + entity.width, entity.y + entity.height);
    const w = br.x - tl.x;
    const h = br.y - tl.y;
    const scale = viewport.scale.x;
    shell.style.transform = `translate(${tl.x}px, ${tl.y}px)`;
    shell.style.width = `${w}px`;
    shell.style.height = `${h}px`;
    shell.style.setProperty('--dv-doc-scale', String(scale));
  };

  const applyShellCull = (entity: DocumentNodeEntity, shell: HTMLDivElement) => {
    const inView = renderManager.isEntityVisible(entity.id, bridge.getSelectedIds());
    shell.style.display = inView ? '' : 'none';
    shell.style.pointerEvents = inView && currentLod.showDocumentText ? 'auto' : 'none';
    applyLodToShell(shell, currentLod);
  };

  const buildShell = (entity: DocumentNodeEntity): HTMLDivElement => {
    const shell = document.createElement('div');
    shell.className = 'dv-document-shell';
    shell.dataset.entityId = entity.id;

    const body = document.createElement('div');
    body.className = 'dv-document-body custom-scrollbar';
    body.contentEditable = 'true';
    body.spellcheck = false;
    body.style.marginTop = `${DOCUMENT_CHROME.headerHeight}px`;
    body.style.height = `calc(100% - ${DOCUMENT_CHROME.headerHeight}px)`;
    body.style.overflow = 'auto';

    for (const block of entity.blocks) {
      const el = document.createElement(blockTag(block.kind, block.level ?? 0));
      el.className = BLOCK_CLASS[block.kind];
      el.dataset.blockId = block.id;
      el.textContent = block.text;
      if (block.kind === 'heading' && block.level) {
        el.dataset.level = String(block.level);
      }
      body.appendChild(el);
    }

    body.addEventListener('scroll', () => {
      bridge.updateEntity(entity.id, { scrollY: body.scrollTop });
    });

    body.addEventListener('input', () => {
      const plainText = body.innerText;
      bridge.updateEntity(entity.id, { plainText, content: plainText });
    });

    body.addEventListener('mouseup', () => {
      if (!currentLod.showDocumentText) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      if (!body.contains(range.commonAncestorContainer)) return;

      const excerpt = sel.toString().trim();
      if (!excerpt) return;

      const pre = body.querySelector('[data-plain-start]');
      let start = 0;
      if (pre) start = Number(pre.getAttribute('data-plain-start') ?? '0');

      const charRange = computeSelectionCharRange(entity, body, range, start);
      bridge.setPendingLinkSource({
        documentId: entity.id,
        charRange,
        excerpt,
      });
    });

    const greeking = buildGreekingLayer(entity);

    shell.addEventListener('pointerdown', (e) => {
      if (bridge.getActiveTool() === 'link') {
        e.stopPropagation();
        return;
      }
      e.stopPropagation();
      const multi = e.shiftKey;
      const current = bridge.getSelectedIds();
      if (multi) {
        const next = new Set(current);
        if (next.has(entity.id)) next.delete(entity.id);
        else next.add(entity.id);
        bridge.setSelection([...next]);
      } else {
        bridge.setSelection([entity.id]);
      }
    });

    let dragOrigin: { x: number; y: number; entityX: number; entityY: number } | null = null;

    shell.addEventListener('pointerdown', (e) => {
      if (bridge.getActiveTool() !== 'select') return;
      if ((e.target as HTMLElement).closest('.dv-document-body')) return;
      dragOrigin = { x: e.clientX, y: e.clientY, entityX: entity.x, entityY: entity.y };
      bridge.beginGesture(`doc-move-${entity.id}`, [entity.id]);
      shell.setPointerCapture(e.pointerId);
    });

    shell.addEventListener('pointermove', (e) => {
      if (!dragOrigin) return;
      const dx = (e.clientX - dragOrigin.x) / viewport.scale.x;
      const dy = (e.clientY - dragOrigin.y) / viewport.scale.y;
      bridge.applyGesturePreview(entity.id, {
        x: dragOrigin.entityX + dx,
        y: dragOrigin.entityY + dy,
      });
    });

    shell.addEventListener('pointerup', () => {
      if (!dragOrigin) return;
      dragOrigin = null;
      bridge.commitGesture();
    });

    shell.appendChild(body);
    shell.appendChild(greeking);
    applyLodToShell(shell, currentLod);
    return shell;
  };

  const syncAll = () => {
    const documents = store
      .getAllEntities()
      .filter((e): e is DocumentNodeEntity => e.type === 'document');

    const live = new Set(documents.map((d) => d.id));
    for (const id of shells.keys()) {
      if (!live.has(id)) {
        shells.get(id)?.remove();
        shells.delete(id);
      }
    }

    for (const entity of documents) {
      renderManager.upsertEntity(entity);

      let shell = shells.get(entity.id);
      if (!shell) {
        shell = buildShell(entity);
        shells.set(entity.id, shell);
        root.appendChild(shell);
      } else {
        const body = shell.querySelector('.dv-document-body');
        if (body && Math.abs((entity.scrollY ?? 0) - body.scrollTop) > 1) {
          body.scrollTop = entity.scrollY ?? 0;
        }
      }
      syncShellPosition(entity, shell);
      applyShellCull(entity, shell);
    }
  };

  const unsubCull = renderManager.subscribe(({ lod }) => {
    currentLod = lod;
    for (const [id, shell] of shells) {
      const entity = store.getEntity(id);
      if (entity?.type === 'document') {
        applyShellCull(entity, shell);
        syncShellPosition(entity, shell);
      }
    }
  });

  const onViewportChange = () => {
    renderManager.scheduleViewportFlush();
    for (const [id, shell] of shells) {
      const entity = store.getEntity(id);
      if (entity?.type === 'document') {
        syncShellPosition(entity, shell);
        applyShellCull(entity, shell);
      }
    }
  };

  viewport.on('moved', onViewportChange);
  viewport.on('zoomed', onViewportChange);

  const unsub = store.subscribe((ev) => {
    if (ev.kind === 'reset' || ev.kind === 'clear' || ev.entity?.type === 'document' || ev.kind === 'delete') {
      syncAll();
    }
  });

  syncAll();

  return {
    syncAll,
    destroy() {
      unsub();
      unsubCull();
      viewport.off('moved', onViewportChange);
      viewport.off('zoomed', onViewportChange);
      root.remove();
      shells.clear();
    },
  };
}

function computeSelectionCharRange(
  entity: DocumentNodeEntity,
  body: HTMLElement,
  range: Range,
  baseOffset: number,
): [number, number] {
  const layout = layoutDocumentNode(entity);
  const fullText = entity.plainText;
  const selected = range.toString();
  const idx = fullText.indexOf(selected);
  if (idx >= 0) return [idx, idx + selected.length];

  const bodyRect = body.getBoundingClientRect();
  const r = range.getBoundingClientRect();
  const midY = r.top + r.height / 2 - bodyRect.top + body.scrollTop;
  const line = layout.lines.find((l) => midY >= l.y && midY <= l.y + l.height);
  if (line) {
    const start = line.startChar;
    return [start, Math.min(start + selected.length, fullText.length)];
  }
  return [baseOffset, baseOffset + selected.length];
}

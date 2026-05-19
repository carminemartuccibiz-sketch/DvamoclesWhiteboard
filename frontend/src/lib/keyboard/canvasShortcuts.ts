/**
 * Returns true when global canvas shortcuts (tools, delete, undo) must not run.
 */
export function shouldIgnoreCanvasShortcuts(event: KeyboardEvent): boolean {
  const target = event.target;

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true;
  }

  if (target instanceof HTMLElement) {
    if (target.isContentEditable) return true;
    if (target.closest('.dv-document-body, .dv-document-shell, [contenteditable="true"]')) {
      return true;
    }
  }

  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    if (active.isContentEditable) return true;
    if (active.closest('.dv-document-body, .dv-document-shell, [contenteditable="true"]')) {
      return true;
    }
  }

  return false;
}

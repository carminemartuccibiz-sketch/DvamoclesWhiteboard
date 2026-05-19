import type { DocumentBlock, DocumentNodeEntity } from '../state/schema';

export const DOCUMENT_CHROME = {
  headerHeight: 36,
  paddingX: 14,
  paddingY: 10,
  lineHeight: 1.45,
} as const;

export interface CharRangeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentLayoutLine {
  blockId: string;
  text: string;
  startChar: number;
  endChar: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentLayout {
  contentHeight: number;
  lines: DocumentLayoutLine[];
}

function blockFontSize(kind: DocumentBlock['kind'], base: number, level = 0): number {
  if (kind === 'heading') return base + Math.max(0, 4 - level) * 2;
  if (kind === 'code') return base - 1;
  return base;
}

export function layoutDocumentNode(entity: DocumentNodeEntity): DocumentLayout {
  const blocks = entity.blocks?.length
    ? entity.blocks
    : [{ id: 'blk_0', kind: 'paragraph' as const, text: entity.plainText || entity.content || '', level: 0 }];

  const innerWidth = Math.max(entity.width - DOCUMENT_CHROME.paddingX * 2, 80);
  const lines: DocumentLayoutLine[] = [];
  let cursorY = 0;
  let globalChar = 0;

  for (const block of blocks) {
    const fontSize = blockFontSize(block.kind, entity.fontSize, block.level ?? 0);
    const lineH = fontSize * DOCUMENT_CHROME.lineHeight;
    const prefix = block.kind === 'list-item' ? '• ' : '';
    const displayText = `${prefix}${block.text}`;
    const blockStart = globalChar;

    const words = displayText.split(/\s+/);
    let row = '';
    let rowStartInBlock = 0;

    const flushRow = (rowText: string, startInBlock: number) => {
      if (!rowText) return;
      const startChar = blockStart + startInBlock;
      const endChar = startChar + rowText.length;
      lines.push({
        blockId: block.id,
        text: rowText,
        startChar,
        endChar,
        x: DOCUMENT_CHROME.paddingX,
        y: cursorY,
        width: innerWidth,
        height: lineH,
      });
      cursorY += lineH + 2;
      globalChar = Math.max(globalChar, endChar);
    };

    for (let i = 0; i < words.length; i++) {
      const word = words[i]!;
      const candidate = row ? `${row} ${word}` : word;
      const approxWidth = candidate.length * (fontSize * 0.55);
      if (approxWidth > innerWidth && row) {
        flushRow(row, rowStartInBlock);
        row = word;
        rowStartInBlock = displayText.indexOf(word, rowStartInBlock + row.length);
      } else {
        if (!row) rowStartInBlock = displayText.indexOf(word);
        row = candidate;
      }
    }
    flushRow(row, rowStartInBlock);

    if (globalChar < blockStart + block.text.length + 1) {
      globalChar = blockStart + block.text.length + 1;
    }
    cursorY += 4;
  }

  return {
    contentHeight: Math.max(cursorY, entity.height - DOCUMENT_CHROME.headerHeight),
    lines,
  };
}

/** World-space anchor rect for a char range inside a document node */
export function charRangeToWorldRect(
  entity: DocumentNodeEntity,
  charRange: [number, number],
): CharRangeRect | null {
  const [start, end] = charRange;
  if (start < 0 || end <= start) return null;

  const layout = layoutDocumentNode(entity);
  const scrollY = entity.scrollY ?? 0;
  const matching = layout.lines.filter((line) => line.endChar > start && line.startChar < end);

  if (matching.length === 0) {
    return {
      x: entity.x + DOCUMENT_CHROME.paddingX,
      y: entity.y + DOCUMENT_CHROME.headerHeight - scrollY,
      width: 40,
      height: entity.fontSize * DOCUMENT_CHROME.lineHeight,
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const line of matching) {
    const relStart = Math.max(0, start - line.startChar);
    const relEnd = Math.min(line.text.length, end - line.startChar);
    const charWidth = Math.max(6, line.width / Math.max(line.text.length, 1));
    const lx = entity.x + line.x + relStart * charWidth;
    const ly = entity.y + DOCUMENT_CHROME.headerHeight + line.y - scrollY;
    const rx = entity.x + line.x + relEnd * charWidth;
    const ry = ly + line.height;
    minX = Math.min(minX, lx);
    minY = Math.min(minY, ly);
    maxX = Math.max(maxX, rx);
    maxY = Math.max(maxY, ry);
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 8),
    height: Math.max(maxY - minY, 8),
  };
}

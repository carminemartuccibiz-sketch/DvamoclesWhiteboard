import type { DocumentBlock, DocumentBlockKind } from '../state/schema';

export interface ParsedTextDocument {
  title: string;
  plainText: string;
  blocks: DocumentBlock[];
}

function blockId(index: number): string {
  return `blk_${index}`;
}

/**
 * Parses `.md` / `.txt` into structured blocks with stable global char offsets in plainText.
 */
export function parseTextDocument(raw: string, fileName: string): ParsedTextDocument {
  const title = fileName.replace(/\.(md|txt)$/i, '') || 'Imported Document';
  const normalized = raw.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const blocks: DocumentBlock[] = [];
  const plainParts: string[] = [];
  let index = 0;

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed) {
      plainParts.push('');
      continue;
    }

    let kind: DocumentBlockKind = 'paragraph';
    let text = trimmed;
    let level = 0;

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      kind = 'heading';
      level = heading[1]!.length;
      text = heading[2]!;
    } else if (/^[-*+]\s+/.test(trimmed)) {
      kind = 'list-item';
      level = 1;
      text = trimmed.replace(/^[-*+]\s+/, '');
    } else if (/^\d+\.\s+/.test(trimmed)) {
      kind = 'list-item';
      level = 1;
      text = trimmed.replace(/^\d+\.\s+/, '');
    } else if (trimmed.startsWith('```')) {
      kind = 'code';
      text = trimmed.replace(/^```\w*/, '').replace(/```$/, '') || trimmed;
    }

    blocks.push({ id: blockId(index++), kind, text, level });
    plainParts.push(text);
  }

  if (blocks.length === 0) {
    blocks.push({ id: blockId(0), kind: 'paragraph', text: '(empty document)', level: 0 });
    plainParts.push('(empty document)');
  }

  const plainText = blocks.map((b) => b.text).join('\n');
  return { title, plainText, blocks };
}

export function isTextImportFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.md') || name.endsWith('.txt') || file.type === 'text/plain' || file.type === 'text/markdown';
}

import type { TLDefaultColorStyle } from 'tldraw';

/** Display-only swatches mapped to valid `TLDefaultColorStyle` values */
export const TLDRAW_COLOR_PALETTE: {
  tldraw: TLDefaultColorStyle;
  uiHex: string;
  label: string;
}[] = [
  { tldraw: 'black', uiHex: '#1e1e1e', label: 'Black' },
  { tldraw: 'grey', uiHex: '#9aa0a6', label: 'Grey' },
  { tldraw: 'light-violet', uiHex: '#e8deff', label: 'Light violet' },
  { tldraw: 'violet', uiHex: '#9b6bff', label: 'Violet' },
  { tldraw: 'blue', uiHex: '#3b82f6', label: 'Blue' },
  { tldraw: 'light-blue', uiHex: '#8ec5ff', label: 'Light blue' },
  { tldraw: 'yellow', uiHex: '#f5c542', label: 'Yellow' },
  { tldraw: 'orange', uiHex: '#f97316', label: 'Orange' },
  { tldraw: 'green', uiHex: '#22c55e', label: 'Green' },
  { tldraw: 'light-green', uiHex: '#86efac', label: 'Light green' },
  { tldraw: 'light-red', uiHex: '#fca5a5', label: 'Light red' },
  { tldraw: 'red', uiHex: '#ef4444', label: 'Red' },
];

export const UI_HEX_BY_TLDRAW_COLOR: Partial<Record<TLDefaultColorStyle, string>> =
  Object.fromEntries(TLDRAW_COLOR_PALETTE.map((c) => [c.tldraw, c.uiHex]));

export const PRIMARY_TLDRAW_COLORS = TLDRAW_COLOR_PALETTE.slice(0, 4);

export const EXTENDED_TLDRAW_COLORS = TLDRAW_COLOR_PALETTE.slice(4);

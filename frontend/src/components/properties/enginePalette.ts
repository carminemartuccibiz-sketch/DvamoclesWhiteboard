import type { DvColorStyle } from '../../contracts/styles';

export const ENGINE_COLOR_PALETTE: {
  id: DvColorStyle;
  uiHex: string;
  label: string;
}[] = [
  { id: 'black', uiHex: '#1e1e1e', label: 'Black' },
  { id: 'grey', uiHex: '#9aa0a6', label: 'Grey' },
  { id: 'light-violet', uiHex: '#e8deff', label: 'Light violet' },
  { id: 'violet', uiHex: '#9b6bff', label: 'Violet' },
  { id: 'blue', uiHex: '#3b82f6', label: 'Blue' },
  { id: 'light-blue', uiHex: '#8ec5ff', label: 'Light blue' },
  { id: 'yellow', uiHex: '#f5c542', label: 'Yellow' },
  { id: 'orange', uiHex: '#f97316', label: 'Orange' },
  { id: 'green', uiHex: '#22c55e', label: 'Green' },
  { id: 'light-green', uiHex: '#86efac', label: 'Light green' },
  { id: 'light-red', uiHex: '#fca5a5', label: 'Light red' },
  { id: 'red', uiHex: '#ef4444', label: 'Red' },
];

export const UI_HEX_BY_COLOR: Partial<Record<DvColorStyle, string>> = Object.fromEntries(
  ENGINE_COLOR_PALETTE.map((c) => [c.id, c.uiHex]),
);

export const PRIMARY_COLORS = ENGINE_COLOR_PALETTE.slice(0, 4);

export const EXTENDED_COLORS = ENGINE_COLOR_PALETTE.slice(4);

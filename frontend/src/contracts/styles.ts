/** Engine-native style tokens (formerly tldraw Default*Style values) */

export type DvColorStyle =
  | 'black'
  | 'grey'
  | 'light-violet'
  | 'violet'
  | 'blue'
  | 'light-blue'
  | 'yellow'
  | 'orange'
  | 'green'
  | 'light-green'
  | 'light-red'
  | 'red';

export type DvDashStyle = 'solid' | 'dashed' | 'dotted' | 'draw';

export type DvFillStyle = 'none' | 'semi' | 'solid' | 'pattern';

export type DvSizeStyle = 's' | 'm' | 'l' | 'xl';

export interface DvStyleBag {
  color: DvColorStyle;
  dash: DvDashStyle;
  fill: DvFillStyle;
  size: DvSizeStyle;
  fontDraw: boolean;
}

export const DEFAULT_STYLE_BAG: DvStyleBag = {
  color: 'black',
  dash: 'solid',
  fill: 'none',
  size: 'm',
  fontDraw: false,
};

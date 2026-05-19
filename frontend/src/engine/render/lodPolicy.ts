/** Semantic zoom: below this scale, document text and fine chrome are greeked away */
export const SEMANTIC_ZOOM_LOD_THRESHOLD = 0.3;

export type LodLevel = 'full' | 'greeked';

export interface LodState {
  scale: number;
  level: LodLevel;
  /** HTML document body + Pixi title text */
  showDocumentText: boolean;
  /** Selection outlines and link endpoint dots */
  showSelectionChrome: boolean;
  /** Link curve endpoint circles */
  showLinkAnchors: boolean;
  /** Skip sketchy stroke paths — flat geometric strokes only */
  simplifyStrokes: boolean;
}

export function resolveLodState(scale: number): LodState {
  const greeked = scale < SEMANTIC_ZOOM_LOD_THRESHOLD;
  return {
    scale,
    level: greeked ? 'greeked' : 'full',
    showDocumentText: !greeked,
    showSelectionChrome: !greeked,
    showLinkAnchors: !greeked,
    simplifyStrokes: greeked,
  };
}

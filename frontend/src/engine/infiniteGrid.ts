import { Graphics } from 'pixi.js';
import type { Viewport } from 'pixi-viewport';

const BASE_STEP = 64;
const DOT_RADIUS = 1.15;
const LINE_ALPHA = 0.14;
const DOT_ALPHA = 0.22;

/** Dot grid in world space; redrawn when the viewport moves or zooms */
export function createInfiniteGridLayer(viewport: Viewport) {
  const grid = new Graphics();
  grid.label = 'infinite-grid';
  viewport.addChildAt(grid, 0);

  let visible = false;
  grid.visible = visible;

  const draw = () => {
    if (!visible) return;
    const bounds = viewport.getVisibleBounds();
    const zoom = viewport.scale.x;
    const step = pickStep(zoom);

    grid.clear();

    const startX = Math.floor(bounds.left / step) * step;
    const endX = Math.ceil(bounds.right / step) * step;
    const startY = Math.floor(bounds.top / step) * step;
    const endY = Math.ceil(bounds.bottom / step) * step;

    const minorStep = step / 4;
    const lineWidthMinor = 1 / zoom;
    const lineWidthMajor = 1.25 / zoom;
    const showLines = zoom >= 0.35;

    if (showLines) {
      for (let x = startX; x <= endX; x += minorStep) {
        if (Math.abs(x % step) < 0.001) continue;
        grid
          .moveTo(x, startY)
          .lineTo(x, endY)
          .stroke({ width: lineWidthMinor, color: 0xffffff, alpha: LINE_ALPHA * 0.5 });
      }
      for (let y = startY; y <= endY; y += minorStep) {
        if (Math.abs(y % step) < 0.001) continue;
        grid
          .moveTo(startX, y)
          .lineTo(endX, y)
          .stroke({ width: lineWidthMinor, color: 0xffffff, alpha: LINE_ALPHA * 0.5 });
      }

      for (let x = startX; x <= endX; x += step) {
        grid
          .moveTo(x, startY)
          .lineTo(x, endY)
          .stroke({ width: lineWidthMajor, color: 0xffffff, alpha: LINE_ALPHA });
      }
      for (let y = startY; y <= endY; y += step) {
        grid
          .moveTo(startX, y)
          .lineTo(endX, y)
          .stroke({ width: lineWidthMajor, color: 0xffffff, alpha: LINE_ALPHA });
      }
    }

    const dotR = DOT_RADIUS / zoom;
    for (let x = startX; x <= endX; x += step) {
      for (let y = startY; y <= endY; y += step) {
        grid.circle(x, y, dotR).fill({ color: 0xffffff, alpha: DOT_ALPHA });
      }
    }
  };

  viewport.on('moved', draw);
  viewport.on('zoomed', draw);
  draw();

  return {
    setVisible: (next: boolean) => {
      visible = next;
      grid.visible = next;
      if (next) draw();
      else grid.clear();
    },
    destroy: () => {
      viewport.off('moved', draw);
      viewport.off('zoomed', draw);
      grid.destroy();
    },
  };
}

function pickStep(zoom: number) {
  if (zoom < 0.2) return BASE_STEP * 8;
  if (zoom < 0.4) return BASE_STEP * 4;
  if (zoom < 0.75) return BASE_STEP * 2;
  return BASE_STEP;
}

import type { Graphics } from 'pixi.js';

export function createSeededRng(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    return ((h >>> 0) % 10000) / 10000;
  };
}

export function jitterPoint(
  x: number,
  y: number,
  amount: number,
  rng: () => number,
): { x: number; y: number } {
  return {
    x: x + (rng() - 0.5) * amount,
    y: y + (rng() - 0.5) * amount,
  };
}

export function isSketchyStroke(sloppiness: number): boolean {
  return sloppiness >= 0.5;
}

export function sketchWobbleAmplitude(sloppiness: number, strokeWidth: number): number {
  return (1.5 + sloppiness * 2.5) * Math.max(strokeWidth * 0.35, 1);
}

export function drawSketchyPolyline(
  g: Graphics,
  points: Array<{ x: number; y: number }>,
  seed: string,
  sloppiness: number,
  strokeWidth: number,
  color: number,
  alpha: number,
  closed: boolean,
): void {
  if (points.length < 2) return;
  const rng = createSeededRng(seed);
  const amp = sketchWobbleAmplitude(sloppiness, strokeWidth);
  const wobbled = points.map((p) => jitterPoint(p.x, p.y, amp, rng));

  g.moveTo(wobbled[0]!.x, wobbled[0]!.y);
  for (let i = 1; i < wobbled.length; i++) {
    g.lineTo(wobbled[i]!.x, wobbled[i]!.y);
  }
  if (closed && wobbled.length > 2) {
    g.lineTo(wobbled[0]!.x, wobbled[0]!.y);
  }
  g.stroke({
    color,
    width: strokeWidth,
    alpha,
    cap: 'round',
    join: 'round',
  });
}

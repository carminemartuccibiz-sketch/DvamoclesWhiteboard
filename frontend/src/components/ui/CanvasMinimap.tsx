import { useCallback, useEffect, useRef } from 'react';
import { useEditor, type Editor, type TLShape } from 'tldraw';
import { glassCard } from './panel';
import { cn } from './utils';

const MINIMAP_W = 168;
const MINIMAP_H = 120;
const PAD = 8;

function expandBounds(
  a: { minX: number; minY: number; maxX: number; maxY: number },
  b: { minX: number; minY: number; maxX: number; maxY: number },
) {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

export function CanvasMinimap({ className }: { className?: string }) {
  const editor = useEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINIMAP_W * dpr;
    canvas.height = MINIMAP_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, MINIMAP_W, MINIMAP_H);

    const viewport = editor.getViewportPageBounds();
    const pageBounds = editor.getCurrentPageBounds();

    let content = pageBounds
      ? {
          minX: pageBounds.minX,
          minY: pageBounds.minY,
          maxX: pageBounds.maxX,
          maxY: pageBounds.maxY,
        }
      : viewport
        ? {
            minX: viewport.minX,
            minY: viewport.minY,
            maxX: viewport.maxX,
            maxY: viewport.maxY,
          }
        : null;

    if (viewport && content) {
      content = expandBounds(content, viewport);
    }

    if (!content) {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);
      return;
    }

    const contentW = content.maxX - content.minX || 1;
    const contentH = content.maxY - content.minY || 1;
    const innerW = MINIMAP_W - PAD * 2;
    const innerH = MINIMAP_H - PAD * 2;
    const scale = Math.min(innerW / contentW, innerH / contentH);

    const toMini = (px: number, py: number) => ({
      x: PAD + (px - content.minX) * scale,
      y: PAD + (py - content.minY) * scale,
    });

    ctx.fillStyle = 'rgba(10,10,10,0.85)';
    ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);

    const shapes = editor.getCurrentPageShapes();
    ctx.fillStyle = 'rgba(47, 128, 237, 0.45)';
    for (const shape of shapes) {
      drawShapeMini(ctx, editor, shape, toMini);
    }

    if (viewport) {
      const tl = toMini(viewport.minX, viewport.minY);
      const br = toMini(viewport.maxX, viewport.maxY);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      ctx.fillStyle = 'rgba(47, 128, 237, 0.12)';
      ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    }
  }, [editor]);

  useEffect(() => {
    render();
    const unlisten = editor.store.listen(render);
    return () => unlisten();
  }, [editor, render]);

  const pagePointFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const viewport = editor.getViewportPageBounds();
      const pageBounds = editor.getCurrentPageBounds();
      let content = pageBounds
        ? {
            minX: pageBounds.minX,
            minY: pageBounds.minY,
            maxX: pageBounds.maxX,
            maxY: pageBounds.maxY,
          }
        : viewport
          ? {
              minX: viewport.minX,
              minY: viewport.minY,
              maxX: viewport.maxX,
              maxY: viewport.maxY,
            }
          : null;

      if (viewport && content) content = expandBounds(content, viewport);
      if (!content) return null;

      const rect = canvas.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      const contentW = content.maxX - content.minX || 1;
      const contentH = content.maxY - content.minY || 1;
      const innerW = MINIMAP_W - PAD * 2;
      const innerH = MINIMAP_H - PAD * 2;
      const scale = Math.min(innerW / contentW, innerH / contentH);

      const pageX = content.minX + (localX - PAD) / scale;
      const pageY = content.minY + (localY - PAD) / scale;
      return { x: pageX, y: pageY };
    },
    [editor],
  );

  const centerCameraOn = useCallback(
    (clientX: number, clientY: number) => {
      const point = pagePointFromEvent(clientX, clientY);
      if (!point) return;
      editor.centerOnPoint(point, { animation: { duration: 120 } });
    },
    [editor, pagePointFromEvent],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    centerCameraOn(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    centerCameraOn(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className={cn(
        glassCard,
        'pointer-events-auto rounded-xl overflow-hidden border border-white/10 shadow-2xl',
        className,
      )}
      style={{ width: MINIMAP_W, height: MINIMAP_H }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        style={{ width: MINIMAP_W, height: MINIMAP_H }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        aria-label="Canvas minimap"
      />
    </div>
  );
}

function drawShapeMini(
  ctx: CanvasRenderingContext2D,
  editor: Editor,
  shape: TLShape,
  toMini: (x: number, y: number) => { x: number; y: number },
) {
  const bounds = editor.getShapeMaskedPageBounds(shape.id);
  if (!bounds) return;

  const selected = editor.getSelectedShapeIds().includes(shape.id);
  const tl = toMini(bounds.minX, bounds.minY);
  const br = toMini(bounds.maxX, bounds.maxY);
  const w = Math.max(br.x - tl.x, 1);
  const h = Math.max(br.y - tl.y, 1);

  ctx.fillStyle = selected ? 'rgba(47, 128, 237, 0.75)' : 'rgba(255,255,255,0.22)';
  ctx.fillRect(tl.x, tl.y, w, h);
}

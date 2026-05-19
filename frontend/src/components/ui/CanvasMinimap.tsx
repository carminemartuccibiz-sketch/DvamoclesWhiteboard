import { useCallback, useEffect, useRef } from 'react';
import { useEngine } from '../../engine/EngineContext';
import { glassCard } from './panel';
import { cn } from './utils';

const MINIMAP_W = 168;
const MINIMAP_H = 120;
const PAD = 8;

export function CanvasMinimap({ className }: { className?: string }) {
  const engine = useEngine();
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

    const viewport = engine.getVisibleBounds();
    const entities = engine.getAllEntities();
    const content = engine.getContentBounds() ?? {
      minX: -2000,
      minY: -2000,
      maxX: 2000,
      maxY: 2000,
    };

    const contentW = content.maxX - content.minX;
    const contentH = content.maxY - content.minY;
    const innerW = MINIMAP_W - PAD * 2;
    const innerH = MINIMAP_H - PAD * 2;
    const scale = Math.min(innerW / contentW, innerH / contentH);

    const toMini = (px: number, py: number) => ({
      x: PAD + (px - content.minX) * scale,
      y: PAD + (py - content.minY) * scale,
    });

    ctx.fillStyle = 'rgba(10,10,10,0.85)';
    ctx.fillRect(0, 0, MINIMAP_W, MINIMAP_H);

    for (const entity of entities) {
      const tl = toMini(entity.x, entity.y);
      const br = toMini(entity.x + entity.width, entity.y + entity.height);
      const isDoc = entity.type === 'document';
      ctx.fillStyle = isDoc ? 'rgba(155,107,255,0.45)' : 'rgba(255,255,255,0.35)';
      ctx.fillRect(tl.x, tl.y, Math.max(br.x - tl.x, 2), Math.max(br.y - tl.y, 2));
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

    const center = toMini(engine.camera.x, engine.camera.y);
    ctx.fillStyle = 'rgba(47, 128, 237, 0.9)';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [engine]);

  useEffect(() => {
    render();
    return engine.subscribe(render);
  }, [engine, render]);

  const pagePointFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      const content = engine.getContentBounds() ?? {
        minX: -2000,
        minY: -2000,
        maxX: 2000,
        maxY: 2000,
      };

      const contentW = content.maxX - content.minX;
      const contentH = content.maxY - content.minY;
      const innerW = MINIMAP_W - PAD * 2;
      const innerH = MINIMAP_H - PAD * 2;
      const scale = Math.min(innerW / contentW, innerH / contentH);

      return {
        x: content.minX + (localX - PAD) / scale,
        y: content.minY + (localY - PAD) / scale,
      };
    },
    [engine],
  );

  const centerCameraOn = useCallback(
    (clientX: number, clientY: number) => {
      const point = pagePointFromEvent(clientX, clientY);
      if (!point) return;
      engine.centerOnPoint(point.x, point.y);
    },
    [engine, pagePointFromEvent],
  );

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
        onPointerDown={(e) => {
          draggingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          centerCameraOn(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!draggingRef.current) return;
          centerCameraOn(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          draggingRef.current = false;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerLeave={() => {
          draggingRef.current = false;
        }}
        aria-label="Canvas minimap"
      />
    </div>
  );
}

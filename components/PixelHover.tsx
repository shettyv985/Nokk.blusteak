import { useEffect, useRef, useCallback } from "react";

interface PixelHoverProps {
  src: string;
  alt?: string;
  pixelSize?: number;
  trailLength?: number; // how many 3x3 blocks in the trail
}

export function PixelHover({
  src,
  alt = "",
  pixelSize = 10,
  trailLength = 5,
}: PixelHoverProps) {
  const wrapRef      = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const loadedRef    = useRef(false);
  const rafRef       = useRef<number>(0);
  const mouseRef     = useRef<{ x: number; y: number } | null>(null);
  const activeRef    = useRef(false);
  const colsRef      = useRef(0);
  const rowsRef      = useRef(0);

  // queue of { col, row } centers — max length = trailLength
  const trailRef = useRef<{ col: number; row: number }[]>([]);

  const redrawCell = useCallback((
    ctx: CanvasRenderingContext2D,
    col: number, row: number
  ) => {
    const off = offscreenRef.current;
    if (!off) return;
    const ps = pixelSize;
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(off, col * ps, row * ps, ps, ps, col * ps, row * ps, ps, ps);
  }, [pixelSize]);

  const eraseBlock = useCallback((
    ctx: CanvasRenderingContext2D,
    col: number, row: number
  ) => {
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const c = col + dc;
        const r = row + dr;
        if (c < 0 || r < 0 || c >= colsRef.current || r >= rowsRef.current) continue;
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = 1;
        ctx.fillStyle = "black";
        ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
      }
    }
  }, [pixelSize]);

  const restoreBlock = useCallback((
    ctx: CanvasRenderingContext2D,
    col: number, row: number
  ) => {
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const c = col + dc;
        const r = row + dr;
        if (c < 0 || r < 0 || c >= colsRef.current || r >= rowsRef.current) continue;
        redrawCell(ctx, c, r);
      }
    }
  }, [redrawCell]);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;
    const parent = wrap.parentElement as HTMLElement;
    const w = (parent || wrap).offsetWidth;
    const h = (parent || wrap).offsetHeight;
    if (!w || !h) return;

    canvas.width  = w;
    canvas.height = h;
    colsRef.current = Math.ceil(w / pixelSize);
    rowsRef.current = Math.ceil(h / pixelSize);
    trailRef.current = [];

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    const paint = () => {
      const off = document.createElement("canvas");
      off.width  = w;
      off.height = h;
      off.getContext("2d")!.drawImage(img, 0, 0, w, h);
      offscreenRef.current = off;
      const ctx = canvas.getContext("2d")!;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(off, 0, 0, w, h);
      loadedRef.current = true;
    };
    img.onload = paint;
    if (img.complete) paint();
  }, [src, pixelSize]);

  useEffect(() => {
    init();
    const target = wrapRef.current?.parentElement || wrapRef.current;
    if (!target) return;
    const ro = new ResizeObserver(init);
    ro.observe(target);
    return () => { ro.disconnect(); cancelAnimationFrame(rafRef.current); };
  }, [init]);

  const loop = useCallback(() => {
    if (!activeRef.current) return;

    const canvas = canvasRef.current;
    const m      = mouseRef.current;

    if (canvas && m && loadedRef.current) {
      const ctx    = canvas.getContext("2d")!;
      const newCol = Math.floor(m.x / pixelSize);
      const newRow = Math.floor(m.y / pixelSize);
      const trail  = trailRef.current;
      const head   = trail[trail.length - 1];

      // only update if cursor moved to a new grid cell
      if (!head || head.col !== newCol || head.row !== newRow) {

        // push new head
        trail.push({ col: newCol, row: newRow });
        eraseBlock(ctx, newCol, newRow);

        // if trail exceeds max length, restore and remove the oldest block
        if (trail.length > trailLength) {
          const tail = trail.shift()!;
          restoreBlock(ctx, tail.col, tail.row);
        }
      }
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [pixelSize, trailLength, eraseBlock, restoreBlock]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  const handleMouseEnter = useCallback(() => {
    activeRef.current = true;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const handleMouseLeave = useCallback(() => {
    activeRef.current = false;
    mouseRef.current  = null;
    cancelAnimationFrame(rafRef.current);

    // restore all remaining trail blocks
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    trailRef.current.forEach(({ col, row }) => restoreBlock(ctx, col, row));
    trailRef.current = [];
  }, [restoreBlock]);

  return (
    <div
      ref={wrapRef}
      className="sr-wrap"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <canvas ref={canvasRef} className="sr-canvas" />
      <div className="fp-grain-overlay" />
    </div>
  );
}
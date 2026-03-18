'use client';
import { useEffect, useRef, useCallback } from 'react';
import './Lanyard.css';

interface CardData {
  fullName: string;
  role: string;
  company: string;
  initials: string;
  image?: string;
}

const CARDS: CardData[] = [
  { fullName: 'VARUN SHETTY',     role: 'Developer',       company: 'Blusteak', initials: 'VS', image: '/varun.jpeg'   },
  { fullName: 'ASWATHY SANTHOSH', role: 'UI/UX Designer', company: 'Blusteak', initials: 'AS', image: '/aswathy.jpeg' },
];

// ── image cache ───────────────────────────────────────────────────────────────
const CARD_IMAGES: Record<string, HTMLImageElement> = {};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    if (CARD_IMAGES[src]) return resolve(CARD_IMAGES[src]);
    const img = new Image();
    img.onload  = () => { CARD_IMAGES[src] = img; resolve(img); };
    img.onerror = () => console.warn(`Lanyard: could not load image "${src}"`);
    img.src = src;
  });
}

// ── dimensions ────────────────────────────────────────────────────────────────
const BASE_CW = 192;
const BASE_CH = 280;
const CR      = 14;
const HOOK_H  = 28;
const ACCENT  = '#0F2854';

// Card scale per CSS pixel width — two cards must fit side by side with padding
function getScale(cssW: number): number {
  // Each card needs BASE_CW * scale * 2 + some margin to fit the viewport
  // We target ~38% of screen width per card, capped at 1×
  const target = (cssW * 0.38) / BASE_CW;
  if (target >= 1)    return 1;
  if (target < 0.45)  return 0.45; // never go smaller than 45%
  // round to 2dp to avoid floating-point jitter on resize
  return Math.round(target * 100) / 100;
}

interface P {
  x: number; y: number;
  vx: number; vy: number;
  angle: number; av: number;
  tx: number; ty: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function bp(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, t: number) {
  return {
    x: (1-t)*(1-t)*ax + 2*(1-t)*t*bx + t*t*cx,
    y: (1-t)*(1-t)*ay + 2*(1-t)*t*by + t*t*cy,
  };
}

// ── draw strap ────────────────────────────────────────────────────────────────
function drawStrap(ctx: CanvasRenderingContext2D, ax: number, ay: number, hx: number, hy: number) {
  const mx  = (ax + hx) / 2;
  const sag = 20 + Math.abs(hx - ax) * 0.07;
  const by2 = ay + sag + Math.max(0, (hy - ay) * 0.15);

  ctx.save();
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, by2, hx, hy);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 34; ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, by2, hx, hy);
  ctx.strokeStyle = '#111111'; ctx.lineWidth = 28; ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, by2, hx, hy);
  ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = 3; ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ax, ay); ctx.quadraticCurveTo(mx, by2, hx, hy);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.stroke();

  const label = 'BLUSTEAK';
  for (let i = 0; i < label.length; i++) {
    const t  = 0.88 - i * (0.76 / (label.length - 1));
    const dt = 0.01;
    const p0 = bp(ax, ay, mx, by2, hx, hy, t);
    const p1 = bp(ax, ay, mx, by2, hx, hy, Math.max(0, t - dt));
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    ctx.save();
    ctx.translate(p0.x, p0.y);
    ctx.rotate(ang + Math.PI / 2);
    ctx.font = '600 7px "degular", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.42)';
    ctx.textAlign = 'center';
    ctx.fillText(label[i], 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

// ── draw hook ─────────────────────────────────────────────────────────────────
function drawHook(ctx: CanvasRenderingContext2D, cx: number, cardTopY: number, scale: number) {
  const hw = 14 * scale, hh = HOOK_H * scale;
  const hx = cx - hw / 2, hy = cardTopY - hh;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  const mg = ctx.createLinearGradient(hx, hy, hx + hw, hy + hh);
  mg.addColorStop(0, '#e5e7eb'); mg.addColorStop(0.3, '#ffffff');
  mg.addColorStop(0.6, '#9ca3af'); mg.addColorStop(1, '#6b7280');
  rr(ctx, hx, hy, hw, hh, 4); ctx.fillStyle = mg; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  rr(ctx, hx, hy, hw, hh, 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.7; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, hy + hh / 2, 2.8 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#6b7280'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx - 0.8 * scale, hy + hh / 2 - 0.8 * scale, 1.2 * scale, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
  ctx.restore();
}

// ── draw card ─────────────────────────────────────────────────────────────────
function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  angle: number,
  card: CardData,
  scale: number,
) {
  const CW = BASE_CW * scale;
  const CH = BASE_CH * scale;

  ctx.save();
  ctx.translate(x + CW / 2, y + CH / 2);
  ctx.rotate(angle);

  const rx = -CW / 2, ry = -CH / 2;

  // shadow + white base
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  rr(ctx, rx, ry, CW, CH, CR); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  rr(ctx, rx, ry, CW, CH, CR); ctx.fillStyle = '#ffffff'; ctx.fill();

  const hdrH = 90 * scale;

  // header gradient
  ctx.save();
  rr(ctx, rx, ry, CW, CH, CR); ctx.clip();
  ctx.beginPath(); ctx.rect(rx, ry, CW, hdrH);
  const hg = ctx.createLinearGradient(rx, ry, rx + CW, ry + hdrH);
  hg.addColorStop(0, ACCENT); hg.addColorStop(0.5, '#1a3d6e'); hg.addColorStop(1, ACCENT);
  ctx.fillStyle = hg; ctx.fill();
  for (let i = 0; i < 180; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.055})`;
    ctx.fillRect(rx + Math.random() * CW, ry + Math.random() * hdrH, 1, 1);
  }
  ctx.restore();

  // company name
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = `700 ${11 * scale}px "degular", monospace`;
  ctx.letterSpacing = '0.28em'; ctx.textAlign = 'center';
  ctx.fillText('BLUSTEAK', 0, ry + 20 * scale);
  ctx.letterSpacing = '0';

  // thin separator rule
  const rg = ctx.createLinearGradient(-40 * scale, 0, 40 * scale, 0);
  rg.addColorStop(0, 'transparent'); rg.addColorStop(0.5, 'rgba(255,255,255,0.35)'); rg.addColorStop(1, 'transparent');
  ctx.beginPath(); ctx.moveTo(-42 * scale, ry + 26 * scale); ctx.lineTo(42 * scale, ry + 26 * scale);
  ctx.strokeStyle = rg; ctx.lineWidth = 0.5; ctx.stroke();

  // full name
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${14 * scale}px "degular", sans-serif`;
  ctx.letterSpacing = '0.01em'; ctx.textAlign = 'center';
  ctx.fillText(card.fullName, 0, ry + 50 * scale);
  ctx.letterSpacing = '0';

  // role
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = `400 ${9.5 * scale}px "degular", sans-serif`;
  ctx.letterSpacing = '0.06em'; ctx.textAlign = 'center';
  ctx.fillText(card.role, 0, ry + 68 * scale);
  ctx.letterSpacing = '0';

  // header bottom rule
  const rg2 = ctx.createLinearGradient(rx + 16 * scale, 0, rx + CW - 16 * scale, 0);
  rg2.addColorStop(0, 'transparent'); rg2.addColorStop(0.5, 'rgba(255,255,255,0.2)'); rg2.addColorStop(1, 'transparent');
  ctx.beginPath(); ctx.moveTo(rx + 16 * scale, ry + hdrH - 1); ctx.lineTo(rx + CW - 16 * scale, ry + hdrH - 1);
  ctx.strokeStyle = rg2; ctx.lineWidth = 0.5; ctx.stroke();

  // clip hole
  const holeY = ry + hdrH;
  ctx.beginPath(); ctx.arc(0, holeY, 7 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#f3f4f6'; ctx.fill();
  const ringG = ctx.createLinearGradient(-7 * scale, holeY - 7 * scale, 7 * scale, holeY + 7 * scale);
  ringG.addColorStop(0, '#d1d5db'); ringG.addColorStop(0.5, '#ffffff'); ringG.addColorStop(1, '#9ca3af');
  ctx.strokeStyle = ringG; ctx.lineWidth = 1.5; ctx.stroke();

  // photo area
  const pm     = 14 * scale;
  const photoY = ry + hdrH + 14 * scale;
  const photoX = rx + pm;
  const photoW = CW - pm * 2;
  const photoH = CH - hdrH - 28 * scale;

  ctx.shadowColor = 'rgba(0,0,0,0.1)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
  rr(ctx, photoX, photoY, photoW, photoH, 8);
  const pg = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoH);
  pg.addColorStop(0, '#e9ecf0'); pg.addColorStop(1, '#d4d8de');
  ctx.fillStyle = pg; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // clipped photo content
  ctx.save();
  rr(ctx, photoX, photoY, photoW, photoH, 8); ctx.clip();

  const silBg = ctx.createLinearGradient(photoX, photoY, photoX, photoY + photoH);
  silBg.addColorStop(0, '#dde3ec'); silBg.addColorStop(1, '#c8d0db');
  ctx.fillStyle = silBg;
  ctx.fillRect(photoX, photoY, photoW, photoH);

  const loadedImg = card.image ? CARD_IMAGES[card.image] : undefined;
  if (loadedImg) {
    const imgAspect = loadedImg.width / loadedImg.height;
    const boxAspect = photoW / photoH;
    let sw = photoW, sh = photoH, sx = photoX, sy = photoY;
    if (imgAspect > boxAspect) {
      sw = photoH * imgAspect;
      sx = photoX - (sw - photoW) / 2;
    } else {
      sh = photoW / imgAspect;
      sy = photoY - (sh - photoH) / 2;
    }
    ctx.drawImage(loadedImg, sx, sy, sw, sh);
  } else {
    // fallback silhouette
    const sc    = photoX + photoW / 2;
    const headR = photoH * 0.17;
    const headY = photoY + photoH * 0.32;
    ctx.beginPath(); ctx.arc(sc, headY, headR, 0, Math.PI * 2);
    ctx.fillStyle = '#8fa3bb'; ctx.fill();
    ctx.beginPath(); ctx.arc(sc, photoY + photoH * 1.04, photoH * 0.44, Math.PI, 0);
    ctx.fillStyle = '#8fa3bb'; ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${headR}px "degular", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(card.initials, sc, headY + headR * 0.38);
  }
  ctx.restore();

  // borders
  rr(ctx, photoX, photoY, photoW, photoH, 8);
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.stroke();
  rr(ctx, rx, ry, CW, CH, CR);
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1; ctx.stroke();

  ctx.restore();
}

// ── component ─────────────────────────────────────────────────────────────────
export default function Lanyard() {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);
  const scaleRef  = useRef(1);
  const dprRef    = useRef(1);   // devicePixelRatio — kept in sync on resize
  const cssWRef   = useRef(0);   // CSS width of canvas (not physical pixels)
  const cssHRef   = useRef(0);   // CSS height of canvas
  const timeRef   = useRef(0);
  const mouseRef  = useRef<{ x: number; y: number } | null>(null);

  const states = useRef<P[]>([
    { x: 0, y: 80, vx: -2.5, vy: 3,  angle: -0.15, av:  0.01, tx: 0, ty: 80 },
    { x: 0, y: 80, vx:  2.5, vy: 3,  angle:  0.15, av: -0.01, tx: 0, ty: 80 },
  ]);

  const drags = useRef(CARDS.map(() => ({
    active: false, ox: 0, oy: 0, lastX: 0, lastY: 0, pvx: 0, pvy: 0, smoothVx: 0,
  })));

  // Anchors are expressed in CSS pixels.
  // On mobile (≤640px) both cards hang from the centre, offset slightly so
  // they don't overlap. On desktop they spread to 28% / 72% as before.
  const getAnchors = useCallback((cssW: number) => {
    const isMobile = cssW <= 640;
    const CW = BASE_CW * getScale(cssW);
    if (isMobile) {
      // spread anchors to 22%/78% so both cards are clearly visible
      // with a good gap between them, centred as a pair
      const gap    = cssW * 0.56;   // total spread between the two anchor points
      const centre = cssW / 2;
      return [
        { ax: centre - gap / 2, ay: 0 },
        { ax: centre + gap / 2, ay: 0 },
      ];
    }
    return [
      { ax: cssW * 0.28, ay: 0 },
      { ax: cssW * 0.72, ay: 0 },
    ];
  }, []);

  useEffect(() => {
    CARDS.forEach(c => { if (c.image) loadImage(c.image); });

    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => {
      const dpr  = window.devicePixelRatio || 1;
      const cssW = wrap.clientWidth;
      const cssH = wrap.clientHeight;

      // Physical pixel dimensions — eliminates blur on retina / all mobile screens
      canvas.width  = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);

      // CSS size stays the same so layout is unaffected
      canvas.style.width  = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      dprRef.current  = dpr;
      cssWRef.current = cssW;
      cssHRef.current = cssH;
      scaleRef.current = getScale(cssW);

      const a  = getAnchors(cssW);
      const CH = BASE_CH * scaleRef.current;
      // place card below anchor by rope length on first load
      const ropeInit = cssW <= 640 ? cssH * 0.40 : 220;
      const CH_      = BASE_CH * scaleRef.current;
      const initY    = Math.max(60, ropeInit - CH_ / 2 + 40);
      states.current.forEach((s, i) => {
        const CW = BASE_CW * scaleRef.current;
        if (!drags.current[i].active) {
          s.x  = a[i].ax - CW / 2;
          s.tx = s.x;
          s.y  = initY;
          s.ty = initY;
        }
      });
    };
    resize();
    window.addEventListener('resize', resize);

    // Mouse coords are in CSS pixels — keep them that way (we scale ctx, not coords)
    const onMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onTouchMove = (e: TouchEvent) => {
      const r   = canvas.getBoundingClientRect();
      const t   = e.touches[0];
      mouseRef.current = { x: t.clientX - r.left, y: t.clientY - r.top };
    };
    const onMouseLeave = () => { mouseRef.current = null; };
    canvas.addEventListener('mousemove',  onMouseMove);
    canvas.addEventListener('touchmove',  onTouchMove, { passive: true });
    canvas.addEventListener('mouseleave', onMouseLeave);

    // Physics constants
    const GRAVITY     = 0.52;
    const DAMPING     = 0.78;
    const ANG_DAMP    = 0.82;
    const ROPE        = 220; // overridden per-frame inside loop for mobile
    const STIFF       = 0.18;
    const MAX_STRETCH = 55;
    const MAX_ANGLE   = 0.52;

    // Magnet constants
    const MAGNET_RADIUS   = 340;
    const MAGNET_LERP     = 0.18;
    const MAGNET_STRENGTH = 0.72;

    // Idle swing constants
    const SWING_SPEED  = 0.0008;
    const SWING_AMOUNT = 28;

    function loop(ts: number) {
      timeRef.current = ts;

      const ctx  = canvas!.getContext('2d');
      if (!ctx) return;

      const dpr   = dprRef.current;
      const cssW  = cssWRef.current;
      const cssH  = cssHRef.current;
      const scale = scaleRef.current;
      const CW    = BASE_CW * scale;
      const CH    = BASE_CH * scale;
      const mouse = mouseRef.current;

      // ── scale context once so ALL drawing uses CSS pixels ──────────────────
      // This is the key fix: every coordinate in draw functions stays in CSS
      // px space; the ctx scale handles the physical pixel mapping.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const anch     = getAnchors(cssW);
      // on mobile make the rope as long as ~52% of screen height so cards hang centre-screen
      const ROPE_DYN = cssW <= 640 ? cssH * 0.40 : 220;

      states.current.forEach((s, i) => {
        const d = drags.current[i];
        const { ax, ay } = anch[i];

        if (!d.active) {
          // idle swing — reduce amplitude on mobile so cards stay centred
          const isMobile = cssW <= 640;
          const swingAmp = isMobile ? 8 : SWING_AMOUNT;
          const phase    = i * Math.PI;
          const swingX   = Math.sin(ts * SWING_SPEED + phase) * swingAmp;
          const restX    = ax - CW / 2 + swingX;
          // restY: hang naturally below anchor, but clamp to viewport
          const restY    = ROPE_DYN - CH / 2 + 40;

          // magnet pull
          let targetX = restX;
          let targetY = restY;
          if (mouse) {
            const cardCx = s.x + CW / 2;
            const cardCy = s.y + CH / 2;
            const mdx    = mouse.x - cardCx;
            const mdy    = mouse.y - cardCy;
            const mdist  = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < MAGNET_RADIUS) {
              const t  = (1 - mdist / MAGNET_RADIUS) * MAGNET_STRENGTH;
              targetX  = restX + mdx * t;
              targetY  = restY + mdy * t;
            }
          }

          s.tx += (targetX - s.tx) * MAGNET_LERP;
          s.ty += (targetY - s.ty) * MAGNET_LERP;

          // rope spring
          const topX = s.x + CW / 2, topY = s.y - HOOK_H * scale;
          const dx   = topX - ax, dy = topY - ay;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const maxDist = ROPE_DYN + MAX_STRETCH;
          if (dist > maxDist) {
            const sc2 = maxDist / dist;
            s.x = ax + dx * sc2 - CW / 2;
            s.y = ay + dy * sc2 + HOOK_H * scale;
          }
          const diff = dist - ROPE_DYN;
          if (diff > 0) {
            s.vx -= (dx / dist) * diff * STIFF;
            s.vy -= (dy / dist) * diff * STIFF;
          }

          s.vx += (s.tx - s.x) * 0.12;
          s.vy += (s.ty - s.y) * 0.12;
          s.vy += GRAVITY;
          s.vx *= DAMPING;
          s.vy *= DAMPING;

          const naturalAngle = (s.x + CW / 2 - ax) * 0.0045;
          s.av += (naturalAngle - s.angle) * 0.055;
          s.av *= ANG_DAMP;
          const nextAngle = s.angle + s.av;
          if (nextAngle > MAX_ANGLE)       { s.angle = MAX_ANGLE;  s.av *= -0.3; }
          else if (nextAngle < -MAX_ANGLE) { s.angle = -MAX_ANGLE; s.av *= -0.3; }
          else                              { s.angle = nextAngle; }

          s.x += s.vx; s.y += s.vy;

          const maxY = cssH - CH - 10;
          if (s.y > maxY) { s.y = maxY; s.vy *= -0.25; }
          if (s.y < 20)   { s.y = 20;   s.vy *= -0.25; }
          // on mobile clamp tighter so cards never slide off screen
          const isMob  = cssW <= 640;
          const xMin   = isMob ? -CW * 0.1 : -CW * 0.4;
          const xMax   = isMob ? cssW - CW * 0.9 : cssW - CW * 0.6;
          if (s.x < xMin) { s.x = xMin; s.vx *= -0.28; }
          if (s.x > xMax) { s.x = xMax; s.vx *= -0.28; }

        } else {
          d.smoothVx += (d.pvx - d.smoothVx) * 0.18;
          const targetAngle = d.smoothVx * 0.025;
          s.angle += (targetAngle - s.angle) * 0.12;
          s.tx = s.x;
          s.ty = s.y;
        }
      });

      // straps
      states.current.forEach((s, i) => {
        const { ax, ay } = anch[i];
        ctx.save();
        ctx.translate(s.x + CW / 2, s.y + CH / 2);
        ctx.rotate(s.angle);
        drawStrap(ctx, ax - (s.x + CW / 2), ay - (s.y + CH / 2), 0, -CH / 2 - HOOK_H * scale);
        drawHook(ctx, 0, -CH / 2, scale);
        ctx.restore();
      });

      // cards
      states.current.forEach((s, i) => {
        drawCard(ctx, s.x, s.y, s.angle, CARDS[i], scale);
      });

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove',  onMouseMove);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [getAnchors]);

  // hit-test uses CSS pixels
  const hit = useCallback((mx: number, my: number) => {
    const scale = scaleRef.current;
    const CW = BASE_CW * scale;
    const CH = BASE_CH * scale;
    for (let i = states.current.length - 1; i >= 0; i--) {
      const s = states.current[i];
      if (mx > s.x && mx < s.x + CW && my > s.y && my < s.y + CH) return i;
    }
    return -1;
  }, []);

  const onDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const r  = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const i  = hit(mx, my);
    if (i === -1) return;
    const s = states.current[i];
    drags.current[i] = {
      active: true, ox: mx - s.x, oy: my - s.y,
      lastX: mx, lastY: my, pvx: 0, pvy: 0, smoothVx: 0,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [hit]);

  const onMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const r  = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    drags.current.forEach((d, i) => {
      if (!d.active) return;
      d.pvx = mx - d.lastX;
      d.pvy = my - d.lastY;
      d.lastX = mx;
      d.lastY = my;
      states.current[i].x = mx - d.ox;
      states.current[i].y = my - d.oy;
    });
  }, []);

  const onUp = useCallback(() => {
    drags.current.forEach((d, i) => {
      if (!d.active) return;
      states.current[i].vx = d.pvx * 0.9;
      states.current[i].vy = d.pvy * 0.9;
      states.current[i].av = Math.max(-0.06, Math.min(0.06, d.smoothVx * 0.012));
      d.active = false;
    });
  }, []);

  return (
    <div ref={wrapRef} className="lanyard-wrapper">
      <div className="lanyard-top-bar" />
      <canvas
        ref={canvasRef}
        className="lanyard-canvas"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
    </div>
  );
}
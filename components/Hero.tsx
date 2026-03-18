"use client";
import { useState, useEffect, useRef } from 'react';
import Eye from './Eye';
import TextCursor from './TextCursor';
import './Hero.css';

// Measure canvas text width to balance N vs KK padding
function measureText(text: string, fontPx: number): number {
  if (typeof window === 'undefined') return fontPx * text.length * 0.6;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `300 ${fontPx}px "Averia Serif Libre", serif`;
  return ctx.measureText(text).width;
}

function getEyeSize(vw: number): number {
  if (vw <= 320) return 110;
  if (vw <= 360) return 124;
  if (vw <= 390) return 134;
  if (vw <= 414) return 142;
  if (vw <= 430) return 148;
  if (vw <= 480) return 158;
  if (vw <= 600) return 180;
  if (vw <= 768) return 220;
  if (vw <= 1024) return 260;
  if (vw <= 1280) return 260;
  if (vw <= 1440) return 300;
  if (vw <= 1920) return 300;
  return 420;
}

const TRAIL_WORDS = [
  'Rejection', 'Wrong Logo', 'Bad Copy', 'Off-Brand',
  'Misaligned', 'Wrong Font', 'Bad Resize', 'Low Res',
  'Wrong Color', 'Outdated',
];

export default function Hero() {
  const [eyeSize, setEyeSize] = useState(300);
  const [wordIndex, setWordIndex] = useState(0);

  // Slide-to-action state
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);
  const THRESHOLD = 180; // px to slide before trigger

  useEffect(() => {
    const update = () => setEyeSize(getEyeSize(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex(i => (i + 1) % TRAIL_WORDS.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const trackWidth = trackRef.current?.offsetWidth ?? 240;
  const maxDrag = trackWidth - 56; // 56 = thumb size

  const clamp = (val: number) => Math.max(0, Math.min(val, maxDrag));

  /* ── Pointer start ── */
  const onStart = (clientX: number) => {
    
    startXRef.current = clientX;
    setDragging(true);
  };

  /* ── Pointer move ── */
  const onMove = (clientX: number) => {
    if (!dragging || startXRef.current === null) return;
    const delta = clientX - startXRef.current;
    setDragX(clamp(delta));
  };

  /* ── Pointer end ── */
const onEnd = () => {
  if (!dragging) return;
  setDragging(false);
  if (dragX >= maxDrag * 0.85) {
    setTriggered(true);
    setDragX(maxDrag);
    setTimeout(() => {
      const target = document.querySelector('#contact');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
      // reset after scroll animation completes
      setTimeout(() => {
        setTriggered(false);
        setDragX(0);
      }, 1000);
    }, 500);
  } else {
    setDragX(0);
  }
  startXRef.current = null;
};

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => onStart(e.clientX);
  useEffect(() => {
    const move = (e: MouseEvent) => onMove(e.clientX);
    const up = () => onEnd();
    if (dragging) {
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    }
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging, dragX]);

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => onStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => onMove(e.touches[0].clientX);
  const onTouchEnd = () => onEnd();

  const progress = maxDrag > 0 ? dragX / maxDrag : 0;

  const fontSize = eyeSize * 0.5;

  // Balance: measure N and KK widths, pad the narrower side so eye stays centred
  const [padding, setPadding] = useState({ left: 0, right: 0 });
  useEffect(() => {
    const nW  = measureText('N',  fontSize);
    const kkW = measureText('KK', fontSize);
    const diff = kkW - nW;
    if (diff > 0) setPadding({ left: diff, right: 0 });   // KK wider → pad N side
    else          setPadding({ left: 0, right: -diff });  // N wider  → pad KK side
  }, [fontSize]);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:ital,wght@0,300;1,300&family=DM+Sans:wght@200;300;400&display=swap');`}</style>
      
      <section className="hero-section">

        <TextCursor
          text={TRAIL_WORDS[wordIndex]}
          spacing={90}
          followMouseDirection={false}
          randomFloat={true}
          exitDuration={0.6}
          removalInterval={40}
          maxPoints={8}
        />

        <div className="hero-radial-glow" aria-hidden="true" />

        <div className="hero-inner">

          {/* Callout pill */}
          
        <div className="hero-lockup">
          <div className="hero-callout">
            <span>BUILT TO NEVER BLINK</span>
            <span className="hero-callout-arrow">›</span>
          </div>
          {/* NOKK wordmark — eye perfectly centred via measured padding */}
          <div className="nokk-row">
            <span className="nokk-letter" style={{ fontSize, paddingRight: padding.left,marginRight: -eyeSize * 0.3 }}>N</span>
            <span className="nokk-eye-slot" style={{ width: eyeSize, height: fontSize }}>
              <Eye size={eyeSize} />
            </span>
            <span className="nokk-letter" style={{ fontSize, paddingLeft: padding.right }}>KK</span>
          </div>

          {/* Sub-copy */}
          <p className="hero-copy">
One system that never loses sight of your projects.
<br />Smarter workflows. Consistent creative. Zero blind spots.
          </p>
</div>
          {/* ── Slide-to-start button ── */}
          <div
            ref={trackRef}
            className={`slide-track${triggered ? ' slide-track--done' : ''}`}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* fill behind thumb */}
            <div
              className="slide-fill"
              style={{ width: `${dragX + 56}px`, opacity: 0.15 + progress * 0.25 }}
            />

            {/* label fades out as thumb moves */}
            <span
              className="slide-label"
              style={{ opacity: triggered ? 0 : Math.max(0, 1 - progress * 2) }}
            >
              {triggered ? 'Launching…' : 'SLIDE TO DEMO'}
            </span>

            {/* thumb */}
            <div
  className={`slide-thumb${dragging ? ' slide-thumb--dragging' : ''}${triggered ? ' slide-thumb--done' : ''}`}
  style={{
    transform: `translateX(${dragX}px)`,
    transition: dragging ? 'none' : 'transform 0.4s cubic-bezier(0.65,0,0.076,1)',
  }}
>
  {triggered ? (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="3,10 8,15 17,5" stroke="#1C4D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="3" y1="10" x2="15" y2="10" stroke="#1C4D8D" strokeWidth="2" strokeLinecap="round"/>
      <polyline points="10,4 16,10 10,16" stroke="#1C4D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )}
</div>
          </div>

        </div>
      </section>
    </>
  );
}
"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import "./Feature.css";

function RingText({ text, size }: { text: string; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.40;
  const pathId = "ring-text-path";
  const d = [
    `M ${cx} ${cy - r}`,
    `A ${r} ${r} 0 1 1 ${cx - 0.001} ${cy - r}`,
    "Z",
  ].join(" ");
  return (
    <svg
      className="feature-ring-text-svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs><path id={pathId} d={d} /></defs>
      <text className="feature-ring-text">
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
    </svg>
  );
}

export default function Feature() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ballRef      = useRef<HTMLDivElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering]   = useState(false);
  const [isMobile, setIsMobile]   = useState(false);
  const mouse   = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf     = useRef<number>(0);
  const active  = useRef(false);

  const BALL = 220;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Detect mobile on mount and on resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const loop = useCallback(() => {
    current.current.x = lerp(current.current.x, mouse.current.x, 0.08);
    current.current.y = lerp(current.current.y, mouse.current.y, 0.08);
    if (ballRef.current) {
      ballRef.current.style.transform =
        `translate(calc(${current.current.x}px - 50%), calc(${current.current.y}px - 50%))`;
    }
    raf.current = requestAnimationFrame(loop);
  }, []);

  const returnLoop = useCallback(() => {
    if (!containerRef.current || !ballRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const tx = rect.width - 88;
    const ty = 55;
    const tick = () => {
      current.current.x = lerp(current.current.x, tx, 0.045);
      current.current.y = lerp(current.current.y, ty, 0.045);
      if (ballRef.current) {
        ballRef.current.style.transform =
          `translate(calc(${current.current.x}px - 50%), calc(${current.current.y}px - 50%))`;
      }
      if (Math.abs(current.current.x - tx) > 0.5 || Math.abs(current.current.y - ty) > 0.5) {
        raf.current = requestAnimationFrame(tick);
      } else {
        if (ballRef.current) ballRef.current.removeAttribute('style');
      }
    };
    raf.current = requestAnimationFrame(tick);
  }, []);

  const onEnter = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    cancelAnimationFrame(raf.current);
    active.current = true;
    setHovering(true);
    if (!containerRef.current || !ballRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    ballRef.current.style.right = 'auto';
    ballRef.current.style.left  = '0';
    ballRef.current.style.top   = '0';
    current.current = { x: rect.width - 88, y: 55 };
    mouse.current   = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    raf.current = requestAnimationFrame(loop);
  }, [isMobile, loop]);

  const onLeave = useCallback(() => {
    if (isMobile) return;
    cancelAnimationFrame(raf.current);
    active.current = false;
    setHovering(false);
    returnLoop();
  }, [isMobile, returnLoop]);

  const onMove = useCallback((e: React.MouseEvent) => {
    if (isMobile || !active.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, [isMobile]);

  // Force play on iOS — autoPlay alone is not always enough
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = true;
    const attempt = () => {
      vid.play().catch(() => {
        // Retry once on next user interaction if blocked
        document.addEventListener('touchstart', () => vid.play(), { once: true });
      });
    };
    if (vid.readyState >= 2) {
      attempt();
    } else {
      vid.addEventListener('canplay', attempt, { once: true });
    }
  }, [isMobile]); // re-run when source switches mobile ↔ desktop

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return (
    <div
      ref={containerRef}
      className={`feature-wrap${hovering ? " feature-hovering" : ""}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseMove={onMove}
    >
      {/* ── Video ── */}
      <div className="feature-video-placeholder">
        <video
          ref={videoRef}
          key={isMobile ? "mobile" : "desktop"}
          className="feature-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          webkit-playsinline="true"
          x5-playsinline="true"
        >
          {isMobile
            ? <source src="/mobs.mp4" type="video/mp4" />
            : <source src="/laps.mp4" type="video/mp4" />
          }
        </video>
      </div>

      <div ref={ballRef} className="feature-ball">
        <div className="feature-ball-outer">
          <div className="feature-ring-text-wrap">
            <RingText
              text="NOTICE • OVERSEE • KEEP ALIGNED • KEEP IMPROVING •"
              size={BALL}
            />
          </div>
          <div className="feature-ball-inner">
            <div className="feature-ball-arrows">
              <div className="feature-arrow-wrap">
                <div className="feature-arrow-half feature-arrow-half-front">
                  <svg viewBox="0 0 88 85" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd"
                      d="M70.5446 38.25L39.3357 7.04109L45.6997 0.67713L87.7725 42.75L45.6997 84.8228L39.3357 78.4589L70.5446 47.25L0.0912681 47.25L0.0912648 38.25H70.5446Z"
                      fill="rgba(220,235,255,0.9)" />
                  </svg>
                </div>
                <div className="feature-arrow-half feature-arrow-half-back">
                  <svg viewBox="0 0 88 85" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd"
                      d="M70.5446 38.25L39.3357 7.04109L45.6997 0.67713L87.7725 42.75L45.6997 84.8228L39.3357 78.4589L70.5446 47.25L0.0912681 47.25L0.0912648 38.25H70.5446Z"
                      fill="rgba(100,150,255,0.5)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
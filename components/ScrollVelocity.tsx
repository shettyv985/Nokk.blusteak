"use client";
import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import './ScrollVelocity.css';

interface ScrollVelocityProps {
  texts: string[];
  velocity?: number;
  className?: string;
  numCopies?: number;
}

function useElementWidth<T extends HTMLElement>(ref: React.RefObject<T | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    function update() {
      if (ref.current) setWidth(ref.current.offsetWidth);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [ref]);
  return width;
}

function VelocityTrack({
  children,
  baseVelocity,
  className = '',
  numCopies = 10,
}: {
  children: React.ReactNode;
  baseVelocity: number;
  className?: string;
  numCopies?: number;
}) {
  const copyRef   = useRef<HTMLSpanElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const copyWidth = useElementWidth(copyRef);

  const xRef        = useRef(0);
  const lastScrollY = useRef(0);
  const scrollVel   = useRef(0);
  const rafRef      = useRef<number>(0);

  // Touch tracking
  const touchY   = useRef(0);
  const touchVel = useRef(0);
  const touchRaf = useRef<number | null>(null);

  useEffect(() => {
    if (copyWidth === 0) return;

    lastScrollY.current = window.scrollY;

    const onTouch = (e: TouchEvent) => {
      touchY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = touchY.current - e.touches[0].clientY;
      touchVel.current = dy * 8;
      touchY.current = e.touches[0].clientY;
    };
    const onTouchEnd = () => {
      const decay = () => {
        touchVel.current *= 0.85;
        if (Math.abs(touchVel.current) > 0.5) {
          touchRaf.current = requestAnimationFrame(decay);
        } else {
          touchVel.current = 0;
        }
      };
      touchRaf.current = requestAnimationFrame(decay);
    };

    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Raw scroll delta this frame
      const currentScroll = window.scrollY;
      const rawDelta = currentScroll - lastScrollY.current;
      lastScrollY.current = currentScroll;

      // Smooth the scroll velocity
      scrollVel.current = scrollVel.current * 0.85 + rawDelta * 0.15;

      // Velocity factors
      const scrollFactor = scrollVel.current * 0.04;
      const touchFactor  = touchVel.current * 0.01;
      const combined = Math.abs(touchFactor) > Math.abs(scrollFactor)
        ? touchFactor
        : scrollFactor;

      // Base movement always goes in baseVelocity direction
      // scroll/touch adds a multiplier on top — scrolling down speeds up / reverses based on sign
      const baseDir = baseVelocity > 0 ? 1 : -1;
      const baseSpeed = Math.abs(baseVelocity);

      // When scrolling, the speed boost is scroll-direction-aware AND row-direction-aware
      // scrolling down: combined > 0 → row 1 speeds up (positive), row 2 also gets boost in its own direction
      const speedMultiplier = 1 + Math.abs(combined) * 3;
      const scrollBoost = combined * baseDir;

      let moveBy: number;
      if (Math.abs(combined) > 0.01) {
        // Scroll active: move faster in base direction, boosted by scroll magnitude
        moveBy = baseDir * baseSpeed * delta * speedMultiplier;
      } else {
        // No scroll: gentle base crawl
        moveBy = baseDir * baseSpeed * delta;
      }

      xRef.current += moveBy;

      // Wrap seamlessly
      const max   = -copyWidth;
      const range = copyWidth;
      xRef.current = ((xRef.current % range) + range) % range + max;

      if (scrollRef.current) {
        scrollRef.current.style.transform = `translateX(${xRef.current}px)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (touchRaf.current) cancelAnimationFrame(touchRaf.current);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [copyWidth, baseVelocity]);

  const spans: React.ReactElement[] = [];
  for (let i = 0; i < numCopies; i++) {
    spans.push(
      <span className={className} key={i} ref={i === 0 ? copyRef : null}>
        {children}
      </span>
    );
  }

  return (
    <div className="sv-parallax">
      <div ref={scrollRef} className="sv-scroller">
        {spans}
      </div>
    </div>
  );
}

export const ScrollVelocity: React.FC<ScrollVelocityProps> = ({
  texts = [],
  velocity = 80,
  className = '',
  numCopies = 10,
}) => {
  return (
    <section className="sv-section">
      {texts.map((text, index) => (
        <VelocityTrack
          key={index}
          baseVelocity={index % 2 === 0 ? velocity : -velocity}
          className={className}
          numCopies={numCopies}
        >
          {text}&nbsp;
        </VelocityTrack>
      ))}
    </section>
  );
};

export default ScrollVelocity;
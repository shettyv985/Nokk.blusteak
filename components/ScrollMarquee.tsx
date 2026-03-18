"use client";
import { useEffect, useRef, useState, FC } from "react";
import "./ScrollMarquee.css";

interface ScrollMarqueeProps {
  text?: string;
  copies?: number;
  speed?: number;
}

const ScrollMarquee: FC<ScrollMarqueeProps> = ({
  text = "WHAT SLIPPED THROUGH YESTERDAY ✦ WON'T SLIP THROUGH TODAY ✦ OR TOMORROW ✦ EVER AGAIN ✦",
  copies = 8,
  speed = 1.2,
}) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const partRef  = useRef<HTMLDivElement>(null);
  const [scrollingUp, setScrollingUp] = useState(false);

  useEffect(() => {
    const inner = innerRef.current;
    const part  = partRef.current;
    if (!inner || !part) return;

    let x           = 0;
    let partWidth   = 0;
    let lastScrollY = window.scrollY;
    let scrollVel   = 0;
    let raf         = 0;

    const measure = () => { partWidth = part.offsetWidth; };
    measure();
    window.addEventListener("resize", measure);

    const tick = () => {
      const currentY = window.scrollY;
      const delta    = currentY - lastScrollY;
      lastScrollY    = currentY;

      scrollVel = scrollVel * 0.85 + delta * 0.15;

      const isUp = scrollVel < -0.3;
      setScrollingUp(isUp);

      const boost = Math.abs(scrollVel) * 0.4;

      if (isUp) {
        x += speed + boost;
      } else {
        x -= speed + boost;
      }

      if (partWidth > 0) {
        if (x <= -partWidth) x += partWidth;
        if (x > 0) x -= partWidth;
      }

      inner.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [speed]);

  return (
    <section className="sm-marquee">
      <div ref={innerRef} className="sm-inner">
        {Array.from({ length: copies }).map((_, i) => (
          <div key={i} className="sm-part" ref={i === 0 ? partRef : null}>
            {text}
            <span className={`sm-arrow ${scrollingUp ? "sm-arrow--up" : ""}`}>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 100">
    <path fill="currentColor" d="M70.4,58.9L70.1,57l-0.2-0.9c0,0,0,0,0,0l-0.2-0.9c-18.7,3.4-27.6,13.4-31.9,22.7V3h-0.9H35h-0.9v75.3c-4.2-9.7-13.2-20.2-31.9-23.2L1.9,57L1.7,58c0,0,0,0,0,0l-0.1,0.9c28.7,4.5,32.2,27.6,32.5,35.3c-0.1,1.7,0,2.7,0,2.8l0.9-0.1v0l0.5,0l2.4,0.1c0,0,0-0.6,0-1.5v-2.5C38.4,84.4,42.5,63.9,70.4,58.9z"/>
  </svg>
</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ScrollMarquee;
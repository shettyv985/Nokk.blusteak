"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import CustomEase from "gsap/CustomEase";
import "./Preloader.css";

gsap.registerPlugin(CustomEase);
CustomEase.create("hop", "0.9, 0, 0.1, 1");

interface PreloaderProps {
  onComplete?: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  const tl = gsap.timeline({
    delay: 0.1,          // was 0.3
    defaults: { ease: "hop" },
  });

  const counts = document.querySelectorAll(".pre-count");

  counts.forEach((count, index) => {
    const digits = count.querySelectorAll(".pre-digit h1");

    tl.to(
      digits,
      { y: "0%", duration: 0.5, stagger: 0.04 },   // was 1s / 0.075
      index * 0.55                                    // was index * 1
    );

    if (index < counts.length) {
      tl.to(
        digits,
        { y: "-100%", duration: 0.5, stagger: 0.04 }, // was 1s / 0.075
        index * 0.55 + 0.5                             // was index * 1 + 1
      );
    }
  });

  tl.to(".pre-spinner", { opacity: 0, duration: 0.2 });  // was 0.3

  tl.to(".pre-eye", { opacity: 1, duration: 0.3 }, "<");  // was 0.5

  tl.to(".pre-divider", {
    scaleY: "100%",
    duration: 0.5,                                        // was 1
    onComplete: () =>
      gsap.to(".pre-divider", { opacity: 0, duration: 0.2, delay: 0.15 }),  // was 0.3 / 0.3
  });

  tl.to(".pre-eye-lid-right", {
    scaleY: 1,
    duration: 0.2,        // was 0.35
    ease: "power3.in",
    delay: 0.25,          // was 0.5
  });

  tl.to(".pre-eye-lid-right", {
    scaleY: 0,
    duration: 0.25,       // was 0.5
    ease: "power3.out",
    delay: 0.1,           // was 0.15
  });

  tl.to(".pre-eye", { opacity: 0, duration: 0.25 });  // was 0.4

  tl.to(
    ".pre-block",
    {
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
      duration: 0.7,       // was 1
      stagger: 0.07,       // was 0.1
      delay: 0.15,         // was 0.3
      onComplete: () => {
        if (loaderRef.current) {
          loaderRef.current.style.pointerEvents = "none";
        }
        onComplete?.();
      },
    },
    "<"
  );
}, [onComplete]);

  return (
    <div className="pre-loader" ref={loaderRef}>
      <div className="pre-overlay">
        <div className="pre-block" />
        <div className="pre-block" />
      </div>

      {/* Two zero eyes side by side */}
      <div className="pre-eye">
        {/* LEFT eye — no wink */}
        <div className="pre-eye-zero">
          <div className="pre-eye-pupil" />
          <svg className="pre-lashes-svg" viewBox="0 0 100 22" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="20" x2="15" y2="2"  stroke="rgba(200,225,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="34" y1="20" x2="32" y2="0"  stroke="rgba(200,225,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="50" y1="20" x2="50" y2="0"  stroke="rgba(200,225,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="66" y1="20" x2="68" y2="0"  stroke="rgba(200,225,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="82" y1="20" x2="85" y2="2"  stroke="rgba(200,225,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="pre-eye-char">0</span>
        </div>

        {/* RIGHT eye — winks */}
        <div className="pre-eye-zero">
          <div className="pre-eye-pupil" />
          <svg className="pre-lashes-svg" viewBox="0 0 100 22" xmlns="http://www.w3.org/2000/svg">
            <line x1="18" y1="20" x2="15" y2="2"  stroke="rgba(200,225,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="34" y1="20" x2="32" y2="0"  stroke="rgba(200,225,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="50" y1="20" x2="50" y2="0"  stroke="rgba(200,225,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="66" y1="20" x2="68" y2="0"  stroke="rgba(200,225,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
            <line x1="82" y1="20" x2="85" y2="2"  stroke="rgba(200,225,255,0.7)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="pre-eye-char">0</span>

          {/* SVG ellipse lid — matches the oval shape of the "0" */}
          <svg
            className="pre-eye-lid-right"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="50" cy="50" rx="50" ry="50" fill="#000000" />
          </svg>
        </div>
      </div>

      

      <div className="pre-spinner-container">
        <div className="pre-spinner" />
      </div>

      <div className="pre-counter">
        <div className="pre-count">
          <div className="pre-digit"><h1>0</h1></div>
          <div className="pre-digit"><h1>0</h1></div>
        </div>
        <div className="pre-count">
          <div className="pre-digit"><h1>2</h1></div>
          <div className="pre-digit"><h1>7</h1></div>
        </div>
        <div className="pre-count">
          <div className="pre-digit"><h1>6</h1></div>
          <div className="pre-digit"><h1>5</h1></div>
        </div>
        <div className="pre-count">
          <div className="pre-digit"><h1>9</h1></div>
          <div className="pre-digit"><h1>8</h1></div>
        </div>
        <div className="pre-count">
          <div className="pre-digit"><h1>9</h1></div>
          <div className="pre-digit"><h1>9</h1></div>
        </div>
      </div>
    </div>
  );
}
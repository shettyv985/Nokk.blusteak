"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./About.css";

gsap.registerPlugin(ScrollTrigger);

const TAGS = [
  "Tracks Performance",
  "Assigns Tasks Smartly",
  "Checks Your Work",
  "Brand Alignment",
  "Manages Your Schedule",
  "Remembers Everything",
];

function Copy({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const clipRef  = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clip  = clipRef.current;
    const inner = innerRef.current;
    if (!clip || !inner) return;
    inner.classList.add("copy-inner--hidden");
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      setTimeout(() => {
        inner.classList.remove("copy-inner--hidden");
        inner.classList.add("copy-inner--visible");
      }, delay * 1000);
    }, { threshold: 0 });
    io.observe(clip);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={clipRef} className="copy-clip">
      <div ref={innerRef} className="copy-inner">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   EscapingTag
   - sectionRef  = wwd-section (full roam area)
   - click       = fly to random spot inside section
   - hover loose = fly away again
   - 5s idle     = return home
   - placeholder span holds the gap so other pills don't move
───────────────────────────────────────────────────── */
function EscapingTag({
  label,
  sectionRef,
}: {
  label: string;
  sectionRef: React.RefObject<HTMLElement | null>;
}) {
  const pillRef        = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const idleTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loose, setLoose] = useState(false);

  /* random position inside the section */
  const randomPos = useCallback(() => {
    const pill    = pillRef.current;
    const section = sectionRef.current;
    if (!pill || !section) return { x: 0, y: 0 };

    const sr = section.getBoundingClientRect();
    const pr = pill.getBoundingClientRect();
    const pad = 12;

    const x = pad + Math.random() * (sr.width  - pr.width  - pad * 2);
    const y = pad + Math.random() * (sr.height - pr.height - pad * 2);
    return { x, y };
  }, [sectionRef]);

  /* fly to (x,y) relative to section top-left, reset idle */
  const flyTo = useCallback((x: number, y: number) => {
    const pill = pillRef.current;
    if (!pill) return;
    pill.style.left = `${x}px`;
    pill.style.top  = `${y}px`;

    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(returnHome, 5000);
  }, []); // eslint-disable-line

  /* return to original spot, restore flow */
  const returnHome = useCallback(() => {
    const pill        = pillRef.current;
    const placeholder = placeholderRef.current;
    if (!pill) return;
    if (idleTimer.current) clearTimeout(idleTimer.current);

    /* fly back to where the placeholder sits inside the section */
    const section = sectionRef.current;
    if (section && placeholder) {
      const sr = section.getBoundingClientRect();
      const pr = placeholder.getBoundingClientRect();
      const x  = pr.left - sr.left;
      const y  = pr.top  - sr.top;
      pill.style.left = `${x}px`;
      pill.style.top  = `${y}px`;
    }

    /* after transition, put pill back in normal flow */
    setTimeout(() => {
      if (!pill || !placeholder) return;
      pill.style.position   = "";
      pill.style.left       = "";
      pill.style.top        = "";
      pill.style.width      = "";
      pill.style.transition = "";
      pill.style.zIndex     = "";
      placeholder.style.display = "none";
      setLoose(false);
    }, 550);
  }, [sectionRef]);

  /* first click: lift out of flow, show placeholder, fly */
  const handleClick = useCallback(() => {
    const pill        = pillRef.current;
    const placeholder = placeholderRef.current;
    const section     = sectionRef.current;
    if (!pill || !placeholder || !section) return;

    if (!loose) {
      const pr = pill.getBoundingClientRect();
      const sr = section.getBoundingClientRect();

      /* show placeholder BEFORE going absolute so layout doesn't shift */
      placeholder.style.display = "inline-flex";
      placeholder.style.width   = `${pr.width}px`;
      placeholder.style.height  = `${pr.height}px`;

      /* convert viewport coords → section-relative using scrollY, no fixed needed */
      const homeX = pr.left - sr.left;
      const homeY = pr.top  - sr.top;

      pill.style.width      = `${pr.width}px`;
      pill.style.position   = "absolute";
      pill.style.left       = `${homeX}px`;
      pill.style.top        = `${homeY}px`;
      pill.style.margin     = "0";
      pill.style.transition = "none";
      pill.style.zIndex     = "100";

      setLoose(true);

      /* fly on next frame so position:absolute has settled */
      requestAnimationFrame(() => {
        if (!pill) return;
        pill.style.transition = "left 0.4s cubic-bezier(0.22,1,0.36,1), top 0.4s cubic-bezier(0.22,1,0.36,1)";
        const { x, y } = randomPos();
        flyTo(x, y);
      });
    } else {
      const { x, y } = randomPos();
      flyTo(x, y);
    }
  }, [loose, sectionRef, randomPos, flyTo]);

  /* hover while loose → run away */
  const handleMouseEnter = useCallback(() => {
    if (!loose) return;
    const { x, y } = randomPos();
    flyTo(x, y);
  }, [loose, randomPos, flyTo]);

  useEffect(() => () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);

  return (
    <>
      {/* invisible placeholder — keeps the gap in the flex row */}
      <div
        ref={placeholderRef}
        className="wwd-tag-placeholder"
        style={{ display: "none" }}
      />
      <div
        ref={pillRef}
        className={`wwd-tag ${loose ? "wwd-tag--loose" : ""}`}
        onMouseEnter={handleClick}
      >
        <h3>{label}</h3>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────
   Tags wrapper — scroll reveal stagger
───────────────────────────────────────────────────── */
function FallingTags({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const tags = Array.from(el.querySelectorAll<HTMLElement>(".wwd-tag"));
    tags.forEach(t => t.classList.add("wwd-tag--hidden"));
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      tags.forEach((t, i) => {
        setTimeout(() => {
          t.classList.remove("wwd-tag--hidden");
          t.classList.add("wwd-tag--visible");
        }, i * 100);
      });
    }, { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="wwd-tags" ref={wrapperRef}>
      {TAGS.map(tag => (
        <EscapingTag key={tag} label={tag} sectionRef={sectionRef} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Main section
───────────────────────────────────────────────────── */
export default function WhatWeDo() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <>
      <section className="wwd-section" ref={sectionRef}>
        <div className="wwd-container">

          <div className="wwd-header">
            <Copy delay={0.1}>
              <h1>
                <span className="wwd-spacer">&nbsp;</span>
                Every team deserves a<br className="br-mobile" /> second set of eyes
                <br className="br-desktop" />
                <br className="br-mobile" />that never gets tired.<br className="br-mobile" /> Meet Nokk.
                <img
                  src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f440/512.gif"
                  alt="👀"
                  className="wwd-emoji"
                  style={{ display: "inline" }}
                />
              </h1>
            </Copy>
          </div>

          <div className="wwd-content">
            <div className="wwd-col">
              <Copy delay={0.1}>
                <p className="wwd-label">Why Nokk Exists</p>
              </Copy>
              <Copy delay={0.18}>
                <p className="wwd-body">
                  Work was slipping through. Deliverables going out wrong. Tasks sitting
                  unassigned. Not because teams weren't good, because no system existed
                  to watch everything, all the time. So Nokk stepped in. It lives inside
                  your existing project management tool, checks every deliverable, assigns
                  the right tasks to the right people, and keeps everything moving. It
                  never blinks.
                </p>
              </Copy>
            </div>

            <div className="wwd-col">
              <FallingTags sectionRef={sectionRef} />
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
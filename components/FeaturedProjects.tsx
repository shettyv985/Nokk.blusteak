"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useMotionValue, useSpring } from "motion/react";
import type { SpringOptions } from "motion/react";
import "./FeaturedProjects.css";
import featuredProjectsContent from "./featured-projects-content";
import { PixelHover } from "./PixelHover";

gsap.registerPlugin(ScrollTrigger);


/* ── Copy clip reveal ── */
function Copy({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const clipRef  = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clip  = clipRef.current;
    const inner = innerRef.current;
    if (!clip || !inner) return;
    gsap.set(inner, { y: "105%" });
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        gsap.to(inner, { y: "0%", duration: 1, delay, ease: "power3.out" });
        io.disconnect();
      }
    }, { threshold: 0.01 });
    io.observe(clip);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={clipRef} className="fp-copy-clip">
      <div ref={innerRef} className="fp-copy-inner">{children}</div>
    </div>
  );
}

/* ── Tilt spring config ── */
const springValues: SpringOptions = { damping: 30, stiffness: 100, mass: 2 };

/* ── Glass card with tilt ── */
function GlassCard({ project }: { project: typeof featuredProjectsContent[0] }) {
  const figRef  = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale   = useSpring(1, springValues);
  const [lastY, setLastY] = useState(0);
  const tx      = useMotionValue(0);
  const ty      = useMotionValue(0);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, { stiffness: 350, damping: 30, mass: 1 });

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    const el = figRef.current; if (!el) return;
    const rect    = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width  / 2;
    const offsetY = e.clientY - rect.top  - rect.height / 2;
    rotateX.set((offsetY / (rect.height / 2)) * -10);
    rotateY.set((offsetX / (rect.width  / 2)) *  10);
    tx.set(e.clientX - rect.left);
    ty.set(e.clientY - rect.top);
    rotateFigcaption.set(-(offsetY - lastY) * 0.6);
    setLastY(offsetY);
  }
  function handleEnter() { scale.set(1.015); opacity.set(1); }
  function handleLeave() {
    scale.set(1); opacity.set(0);
    rotateX.set(0); rotateY.set(0); rotateFigcaption.set(0);
  }

  return (
    <div ref={figRef} className="fp-glass-figure"
      onMouseMove={handleMouse} onMouseEnter={handleEnter} onMouseLeave={handleLeave}
    >
      <motion.div
        className="fp-glass-inner featured-project-card-inner"
        style={{ rotateX, rotateY, scale }}
      >
        <div className="featured-project-card-content">
          <div className="featured-project-card-info"><p>{project.info}</p></div>
          <div className="featured-project-card-content-main">
            <div className="featured-project-card-title"><h2>{project.title}</h2></div>
            <div className="featured-project-card-description"><p>{project.description}</p></div>
          </div>
        </div>

        <div className="featured-project-card-img">
          <PixelHover
            src={project.image}
            alt={project.title}
            pixelSize={10}
            trailLength={10}
          />
        </div>

        <div className="fp-glass-shine" aria-hidden="true" />
      </motion.div>
      <motion.div className="fp-glass-tooltip"
        style={{ x: tx, y: ty, opacity, rotate: rotateFigcaption }}
      >{project.title}</motion.div>
    </div>
  );
}

/* ── Sticky stack ── */
const FeaturedProjects = () => {
  useEffect(() => {
    const cards    = gsap.utils.toArray<HTMLElement>(".featured-project-card");
    const isMobile = window.innerWidth <= 1000;

    cards.forEach((card, index) => {
      if (index >= cards.length - 1) return;
      const inner = card.querySelector<HTMLElement>(".featured-project-card-inner");
      if (!inner) return;
      const nextCard = cards[index + 1];

      gsap.fromTo(inner,
        { y: "0%", z: 0, rotationX: 0 },
        {
          y: isMobile ? "-30%" : "-18%",
          z: isMobile ? -150  : -80,
          rotationX: isMobile ? 25 : 12,
          scrollTrigger: {
            trigger: nextCard,
            start: isMobile ? "top 85%" : "top 100%",
            end: "top -75%",
            scrub: true,
            pin: card,
            pinSpacing: false,
          },
        }
      );

      gsap.fromTo(inner,
        { opacity: 1 },
        {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: nextCard,
            start: "top 80%",
            end:   "top 20%",
            scrub: true,
          },
        }
      );
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  }, []);

  return (
    <div className="featured-projects">
      {featuredProjectsContent.map((project, index) => (
        <div key={index} className="featured-project-card" style={{ top: 0 }}>
          <GlassCard project={project} />
        </div>
      ))}
    </div>
  );
};

export default function FeaturedProjectsSection() {
  return (
    <section className="fp-container">
      <div className="fp-header-wrap">
        <Copy delay={0.1}>
          <div className="fp-callout-pill">
            <span>WHAT NOKK DOES</span>
            <span className="fp-callout-arrow">›</span>
          </div>
        </Copy>
        <div className="fp-header-title">
          <Copy delay={0.15}>
            <h2>Smarter workflows start here.</h2>
          </Copy>
        </div>
      </div>
      <FeaturedProjects />
    </section>
  );
}
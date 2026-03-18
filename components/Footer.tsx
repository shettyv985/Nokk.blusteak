"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "./Footer.css";

const Lanyard = dynamic(() => import("./Lanyard"), { ssr: false });

const footerLinks = [
  { label: "Home",     href: "/" },
  { label: "About",    href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Contact",  href: "#contact" },
];

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/* ── ShuffleText ── */
function ShuffleText({ onClick }: { onClick: () => void }) {
  const DEFAULT = "WANNA SEE THE BRAINS BEHIND THIS";
  const [display, setDisplay] = useState(DEFAULT);
  const rafRef    = useRef<number | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  function cancelAll() {
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    rafRef.current = null; timerRef.current = null;
  }

  function scrambleTo(target: string, onDone?: () => void) {
    cancelAll();
    let frame = 0;
    const total = target.length * 4;
    function tick() {
      if (!activeRef.current) return;
      frame++;
      const resolved = Math.floor(frame / 4);
      setDisplay(target.split("").map((c, i) => {
        if (c === " ") return " ";
        if (i < resolved) return target[i];
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join(""));
      if (frame < total) { rafRef.current = requestAnimationFrame(tick); }
      else { setDisplay(target); onDone?.(); }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  const onEnter = () => {
    cancelAll(); activeRef.current = true;
    scrambleTo("VARUN SHETTY", () => {
      timerRef.current = setTimeout(() => scrambleTo("ASWATHY SANTHOSH"), 1000);
    });
  };

  const onLeave = () => {
    cancelAll(); activeRef.current = true;
    scrambleTo(DEFAULT, () => { activeRef.current = false; });
  };

  const onTap = (e: React.TouchEvent) => {
    e.preventDefault(); cancelAll(); activeRef.current = true;
    scrambleTo("varun shetty", () => {
      timerRef.current = setTimeout(() => {
        scrambleTo("aswathy santhosh", () => {
          timerRef.current = setTimeout(() => {
            onClick();
            timerRef.current = setTimeout(() => {
              cancelAll(); activeRef.current = true;
              scrambleTo(DEFAULT, () => { activeRef.current = false; });
            }, 800);
          }, 900);
        });
      }, 1000);
    });
  };

  useEffect(() => () => { cancelAll(); activeRef.current = false; }, []);

  return (
    <span
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      onClick={onClick} onTouchStart={onTap}
      style={{ cursor: "pointer", userSelect: "none", fontFamily: "monospace" }}
    >{display}</span>
  );
}

/* ── LanyardOverlay ── */
function LanyardOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted]     = useState(false);
  const [visible, setVisible]     = useState(false);
  const [countdown, setCountdown] = useState(7);
  const [isLaptop, setIsLaptop]   = useState(false);
  const autoRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setIsLaptop(window.innerWidth >= 1024); }, []);

  useEffect(() => {
    if (open) {
      setMounted(true); setCountdown(7);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      countRef.current = setInterval(() => {
        setCountdown(p => { if (p <= 1) { clearInterval(countRef.current!); return 0; } return p - 1; });
      }, 1000);
      autoRef.current = setTimeout(() => onClose(), 7000);
    } else {
      setVisible(false);
      if (autoRef.current)  clearTimeout(autoRef.current);
      if (countRef.current) clearInterval(countRef.current);
      const t = setTimeout(() => setMounted(false), 700);
      return () => clearTimeout(t);
    }
    return () => {
      if (autoRef.current)  clearTimeout(autoRef.current);
      if (countRef.current) clearInterval(countRef.current);
    };
  }, [open, onClose]);

  if (!mounted) return null;
  const pct = (countdown / 7) * 100;

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:9998,background:visible?"rgba(2,5,16,0.92)":"rgba(2,5,16,0)",transition:"background 0.5s ease" }} />
      <div style={{ position:"fixed",top:0,left:0,right:0,height:"2px",zIndex:10002,background:"rgba(255,255,255,0.05)",opacity:visible?1:0,transition:"opacity 0.3s" }}>
        <div style={{ height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#0F2854,#1a3d6e,#0F2854)",transition:"width 1s linear",boxShadow:"0 0 8px rgba(15,40,84,0.9)" }} />
      </div>
      <div style={{ position:"fixed",top:"1.4rem",right:"2rem",zIndex:10001,opacity:visible?1:0,transition:"opacity 0.4s 0.3s",pointerEvents:"none" }}>
        <span style={{ fontSize:"0.62rem",color:"rgba(255,255,255,0.3)",letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"monospace" }}>
          closes in {countdown}s · click outside to dismiss
        </span>
      </div>
      <div style={{ position:"fixed",inset:0,zIndex:10000,pointerEvents:"none",transform:visible?"translateY(0)":"translateY(-100%)",transition:"transform 0.72s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ pointerEvents:"all",width:"100%",height:"100%" }}>
          <div style={{ width:"100%",height:"100%",paddingTop:isLaptop?"6vh":"0" }}>
            <Lanyard />
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Slide to Start ── */
function SlideToStart() {
  const [dragX,     setDragX]     = useState(0);
  const [dragging,  setDragging]  = useState(false);
  const [triggered, setTriggered] = useState(false);
  const trackRef  = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);
  const THUMB = 40;

  const maxDrag = (trackRef.current?.offsetWidth ?? 220) - THUMB - 8;
  const clamp   = (v: number) => Math.max(0, Math.min(v, maxDrag));

  const onStart = (clientX: number) => {
    if (triggered) return;
    startXRef.current = clientX; setDragging(true);
  };
  const onMove = (clientX: number) => {
    if (!dragging || startXRef.current === null) return;
    setDragX(clamp(clientX - startXRef.current));
  };
  const onEnd = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragX >= maxDrag * 0.85) {
      setTriggered(true); setDragX(maxDrag);
      setTimeout(() => {
        document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => { setTriggered(false); setDragX(0); }, 1000);
      }, 500);
    } else { setDragX(0); }
    startXRef.current = null;
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => onMove(e.clientX);
    const up   = () => onEnd();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup",   up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging, dragX]);

  const progress = maxDrag > 0 ? dragX / maxDrag : 0;

  return (
    <div
      ref={trackRef}
      className={`ft-slide-track${triggered ? " ft-slide-track--done" : ""}`}
      onMouseDown={e => onStart(e.clientX)}
      onTouchStart={e => onStart(e.touches[0].clientX)}
      onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX); }}
      onTouchEnd={onEnd}
    >
      <div className="ft-slide-fill" style={{ width:`${dragX + THUMB + 8}px`, opacity: 0.15 + progress * 0.3 }} />
      <span className="ft-slide-label" style={{ opacity: triggered ? 0 : Math.max(0, 1 - progress * 2) }}>
        {triggered ? "On the way…" : "SLIDE TO START"}
      </span>
      <div
        className={`ft-slide-thumb${dragging?" ft-slide-thumb--drag":""}${triggered?" ft-slide-thumb--done":""}`}
        style={{ transform:`translateX(${dragX}px)`, transition: dragging?"none":"transform 0.4s cubic-bezier(0.65,0,0.076,1)" }}
      >
        {triggered ? (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <polyline points="3,10 8,15 17,5" stroke="#1C4D8D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <line x1="3" y1="10" x2="15" y2="10" stroke="#1C4D8D" strokeWidth="2" strokeLinecap="round"/>
            <polyline points="10,4 16,10 10,16" stroke="#1C4D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </div>
  );
}



/* ══════════════════════════════════════════════
   MAIN FOOTER
══════════════════════════════════════════════ */
export default function Footer() {
  const [lanyardOpen, setLanyardOpen] = useState(false);
  const handleClose = useRef(() => setLanyardOpen(false)).current;

  return (
    <>
      <LanyardOverlay open={lanyardOpen} onClose={handleClose} />
      <footer className="ft-footer">

        {/* bg glow */}
        <div className="ft-bg-glow" />

        <div className="ft-inner">

          {/* ── TOP: tagline + slide ── */}
          <div className="ft-top">
            <p className="ft-tagline">BUILT TO NEVER BLINK</p>
            <SlideToStart />
          </div>

          {/* ── MID: wordmark + nav + socials ── */}
          <div className="ft-mid">

            {/* wordmark + description */}
            <div className="ft-brand">
              <div className="ft-wordmark">NOKK</div>
              <p className="ft-desc">
                One system that never loses sight of your projects.<br />
                Smarter workflows. Consistent creative. Zero blind spots.
              </p>
            </div>

            {/* right side: nav inline + social icons */}
            <div className="ft-right">
              {/* inline nav — no header */}
              <nav className="ft-nav">
                {footerLinks.map((l, i) => (
                  <a key={l.label} href={l.href} className="ft-nav-link">
                    {l.label}
                    {i < footerLinks.length - 1 && <span className="ft-nav-sep" />}
                  </a>
                ))}
              </nav>

              {/* social icons */}
              <div className="ft-socials">
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="ft-social-icon" aria-label="LinkedIn">
                  <img src="/linkedin.svg" alt="LinkedIn" width="20" height="20" />
                </a>
                <a href="#" className="ft-social-icon" aria-label="Instagram">
                  <img src="/insta.svg" alt="Instagram" width="20" height="20" />
                </a>
              </div>
            </div>

          </div>

          {/* ── BOTTOM: copyright + shuffle ── */}
          <div className="ft-bottom">
            <p className="ft-copy">© {new Date().getFullYear()} Nokk. All rights reserved.</p>
            <p className="ft-copy">
              <ShuffleText onClick={() => setLanyardOpen(true)} />
            </p>
          </div>

        </div>
      </footer>
    </>
  );
}
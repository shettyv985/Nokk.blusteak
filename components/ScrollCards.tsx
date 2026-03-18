"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./ScrollCards.css";

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════════════════════
   EMAILJS CONFIG
══════════════════════════════════════════════════════════ */
const EMAILJS_SERVICE_ID  = "service_zr7rxei";
const EMAILJS_TEMPLATE_ID = "template_4sh6xjj";
const EMAILJS_PUBLIC_KEY  = "9Ux6ahR7KBpx2znQH";

/* ══════════════════════════════════════════════════════════
   SCROLL CARDS DATA
══════════════════════════════════════════════════════════ */
const CARDS = [
  { image: "/Image.png" },
  { image: "https://picsum.photos/seed/nokk-sc2/600/400" },
  { image: "https://picsum.photos/seed/nokk-sc3/600/400" },
  { image: "https://picsum.photos/seed/nokk-sc4/600/400" },
  { image: "https://picsum.photos/seed/nokk-sc5/600/400" },
];

const TRANSFORMS = [
  [[10, 50, -10, 10],  [20, -10, -45, 20]],
  [[0, 47.5, -10, 15], [-25, 15, -45, 30]],
  [[0, 52.5, -10, 5],  [15, -5, -40, 60]],
  [[0, 50, 30, -80],   [20, -10, 60, 5]],
  [[0, 55, -15, 30],   [25, -15, 60, 95]],
];

/* ══════════════════════════════════════════════════════════
   CONTACT — helpers
══════════════════════════════════════════════════════════ */




/* Floating label field */
function Field({ label, type = "text", as = "input", value, onChange, index = 0 }:
  { label: string; type?: string; as?: "input"|"textarea"; value: string; onChange:(v:string)=>void; index?:number }) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;
  return (
    <div className={`ct-field ${focused ? "ct-field--focused" : ""}`}
      style={{ animationDelay: `${index * 0.08}s` }}>
      <label className={`ct-field-label ${floated ? "ct-field-label--up" : ""}`}>{label}</label>
      {as === "textarea"
        ? <textarea className="ct-field-input ct-field-textarea" value={value}
            onChange={e => onChange(e.target.value)} rows={4}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
        : <input className="ct-field-input" type={type} value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      }
      <div className="ct-field-line">
        <div className={`ct-field-line-fill ${focused ? "ct-field-line-fill--on" : ""}`} />
      </div>
    </div>
  );
}


/* Toast */
function Toast({ state }: { state: "idle"|"sending"|"success"|"error" }) {
  if (state === "idle" || state === "sending") return null;
  const ok = state === "success";
  return (
    <div className={`ct-toast ${ok ? "ct-toast--ok" : "ct-toast--err"}`}>
      <span>{ok ? "✓" : "✕"}</span>
      {ok ? "Message sent — we'll be in touch." : "Something went wrong. Try again."}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONTACT SECTION
══════════════════════════════════════════════════════════ */
function ContactSection() {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [status,  setStatus]  = useState<"idle"|"sending"|"success"|"error">("idle");
  const lineRef    = useRef<HTMLDivElement>(null);
  const glowRef    = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  /* scroll-driven vertical line + glow follower */
  useEffect(() => {
    const section = sectionRef.current;
    const line    = lineRef.current;
    const glow    = glowRef.current;
    if (!section || !line) return;
    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const p = Math.max(0, Math.min(1,
        (window.innerHeight - rect.top) / (rect.height + window.innerHeight)
      ));
      line.style.transform = `scaleY(${p})`;
      /* move glow to sit at the tip of the filled line */
      if (glow) {
        const tipY = p * section.offsetHeight;
        glow.style.top = `${tipY - 80}px`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const validate = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      alert("Please fill in all fields."); return false;
    }
    if (name.trim().length < 2 || /^[^a-zA-Z]+$/.test(name.trim())) {
      alert("Please enter a valid name."); return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      alert("Please enter a valid email."); return false;
    }
    const disposable = [
      "mailinator.com","guerrillamail.com","tempmail.com","throwaway.email",
      "fakeinbox.com","sharklasers.com","grr.la","spam4.me","trashmail.com",
      "maildrop.cc","yopmail.com","temp-mail.org","10minutemail.com",
      "getairmail.com","mailnull.com","trashmail.net",
    ];
    if (disposable.includes(email.trim().split("@")[1]?.toLowerCase())) {
      alert("Please use a real email address."); return false;
    }
    const local = email.trim().split("@")[0].toLowerCase();
    if (!/[aeiou]/.test(local) || /[^aeiou\d._+-]{6,}/.test(local)) {
      alert("That email looks invalid."); return false;
    }
    if (message.trim().length < 10) {
      alert("Message must be at least 10 characters."); return false;
    }
    if (!/[aeiou]/i.test(message) || /[^aeiou\s\d.,!?'"-]{6,}/i.test(message)) {
      alert("Your message doesn't look readable."); return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setStatus("sending");
    try {
      const emailjs = await import("@emailjs/browser");
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
        { from_name: name.trim(), from_email: email.trim(), message: message.trim(), reply_to: email.trim() },
        { publicKey: EMAILJS_PUBLIC_KEY }
      );
      setStatus("success");
      setName(""); setEmail(""); setMessage("");
    } catch { setStatus("error"); }
    finally { setTimeout(() => setStatus("idle"), 4000); }
  };

  return (
    <section id="contact" className="ct-section" ref={sectionRef}>

      <div className="ct-vline">
        <div className="ct-vline-track" />
        <div className="ct-vline-fill" ref={lineRef} />
      </div>

      <div className="ct-inner">

        {/* ── HERO ── */}
        <div className="ct-hero">
          <span className="ct-hero-eyebrow">It starts here</span>
          <h1 className="ct-hero-h1">
            Let nothing<br />
            slip.Start<br />
            Nokk.
          </h1>
          <p className="ct-hero-sub">
            Tell us what you're working on.<br />
            We'll show you what Nokk can do.
          </p>
        </div>

        {/* ── FORM ── */}
        <div className="ct-form-wrap">
          <div className="ct-form-glass">
            <div className="ct-form-header">
              <span className="ct-form-label">Contact</span>
              <span className="ct-form-dot" />
            </div>
            <div className="ct-fields">
              <Field label="Your name"     value={name}    onChange={setName}    index={0} />
              <Field label="Email address" type="email"    value={email}   onChange={setEmail}   index={1} />
              <Field label="Message"       as="textarea"   value={message} onChange={setMessage} index={2} />
            </div>
            <button
              className={`ct-submit ${status === "sending" ? "ct-submit--sending" : ""}`}
              disabled={status === "sending"}
              onClick={handleSubmit}
            >
              <span className="ct-submit-text">
                {status === "sending" ? "Sending…" : "Send message"}
              </span>
              <span className="ct-submit-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <line x1="5" y1="19" x2="19" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <polyline points="8,5 19,5 19,16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <div className="ct-submit-bg" />
            </button>
          </div>

        </div>

      </div>

      <div className="ct-footer">
        <span>© {new Date().getFullYear()} Nokk. All rights reserved.</span>
        <span>Built for teams that move fast.</span>
      </div>

      <Toast state={status} />
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SCROLL CARDS INTERNALS
══════════════════════════════════════════════════════════ */
function driveDesktop(p: number, header: HTMLElement, cards: HTMLElement[], vw: number, cardWidth: number) {
  const maxTranslate = header.offsetWidth - vw;
  gsap.set(header, { x: -p * maxTranslate });
  const cardEndX = -((vw + cardWidth) / cardWidth) * 100;
  cards.forEach((card, index) => {
    const delay = index * 0.1125;
    const cardProgress = Math.max(0, Math.min((p - delay) * 2, 1));
    if (cardProgress > 0) {
      const yPos = TRANSFORMS[index][0];
      const rotations = TRANSFORMS[index][1];
      const cardX = gsap.utils.interpolate(25, cardEndX, cardProgress);
      const yProgress = cardProgress * 3;
      const yIndex = Math.min(Math.floor(yProgress), yPos.length - 2);
      const yInterp = yProgress - yIndex;
      const cardY = gsap.utils.interpolate(yPos[yIndex], yPos[yIndex + 1], yInterp);
      const cardRot = gsap.utils.interpolate(rotations[yIndex], rotations[yIndex + 1], yInterp);
      gsap.set(card, { xPercent: cardX, yPercent: cardY, rotation: cardRot, opacity: 1 });
    } else {
      gsap.set(card, { opacity: 0 });
    }
  });
}

function driveMobile(p: number, h1: HTMLElement, cards: HTMLElement[], vw: number, cardWidth: number, yDamp: number, startOffset: number) {
  const endX = (vw / 1.5) - h1.scrollWidth;
  gsap.set(h1, { x: startOffset + p * (endX - startOffset) });
  const cardEndX = -((vw + cardWidth) / cardWidth) * 100;
  cards.forEach((card, index) => {
    const delay = index * 0.1125;
    const cardProgress = Math.max(0, Math.min((p - delay) * 1.4, 1));
    if (cardProgress > 0) {
      const yPos = TRANSFORMS[index][0];
      const rotations = TRANSFORMS[index][1];
      const cardX = gsap.utils.interpolate(25, cardEndX, cardProgress);
      const yProgress = cardProgress * 3;
      const yIndex = Math.min(Math.floor(yProgress), yPos.length - 2);
      const yInterp = yProgress - yIndex;
      const cardY = gsap.utils.interpolate(yPos[yIndex] * yDamp, yPos[yIndex + 1] * yDamp, yInterp);
      const cardRot = gsap.utils.interpolate(rotations[yIndex], rotations[yIndex + 1], yInterp);
      gsap.set(card, { xPercent: cardX, yPercent: cardY, rotation: cardRot, opacity: 1 });
    } else {
      gsap.set(card, { opacity: 0 });
    }
  });
}

function CardList({ refs }: { refs: React.MutableRefObject<HTMLDivElement[]> }) {
  return (
    <>
      {CARDS.map((card, i) => (
        <div key={i} className="sc-card" ref={el => { if (el) refs.current[i] = el; }}>
          <div className="sc-card-img">
            <img src={card.image} alt={`Work sample ${i + 1}`} />
          </div>
        </div>
      ))}
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════ */
export default function ScrollCards() {
  const deskSectionRef = useRef<HTMLElement>(null);
  const deskHeaderRef  = useRef<HTMLDivElement>(null);
  const deskCardsRef   = useRef<HTMLDivElement[]>([]);
  const mobWrapRef     = useRef<HTMLDivElement>(null);
  const mobInnerRef    = useRef<HTMLDivElement>(null);
  const mobHeaderRef   = useRef<HTMLDivElement>(null);
  const mobCardsRef    = useRef<HTMLDivElement[]>([]);
  const rafRef         = useRef(0);

  /* ── DESKTOP ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 1025) return;
    const section = deskSectionRef.current;
    const header  = deskHeaderRef.current;
    const cards   = deskCardsRef.current;
    if (!section || !header || !cards.length) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardWidth = cards[0].offsetWidth;
    cards.forEach(c => gsap.set(c, { opacity: 0 }));
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: `+=${vh * 2}px`,
      pin: true,
      pinSpacing: true,
      onUpdate(self) { driveDesktop(self.progress, header!, cards, vw, cardWidth); },
    });
    return () => trigger.kill();
  }, []);

  /* ── MOBILE ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 1025) return;
    const wrap   = mobWrapRef.current;
    const inner  = mobInnerRef.current;
    const header = mobHeaderRef.current;
    const cards  = mobCardsRef.current;
    if (!wrap || !inner || !header || !cards.length) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardWidth = cards[0].offsetWidth;
    const yDamp = vw <= 320 ? 0.28 : vw <= 360 ? 0.33 : vw <= 480 ? 0.42 : vw <= 768 ? 0.55 : 0.72;
    const startOffset = vw * 0.08;
    const scrollH = vh * 12;
    const h1 = header.querySelector("h1") as HTMLElement;
    if (!h1) return;
    gsap.set(h1, { x: startOffset });
    cards.forEach(c => gsap.set(c, { opacity: 0 }));
    driveMobile(0, h1, cards, vw, cardWidth, yDamp, startOffset);
    const tick = () => {
      const wrapTop  = wrap.getBoundingClientRect().top + window.scrollY;
      const scrolled = window.scrollY - wrapTop;
      const progress = Math.max(0, Math.min(1, scrolled / scrollH));
      driveMobile(progress, h1, cards, vw, cardWidth, yDamp, startOffset);
      if (progress >= 0.98) {
        cards.forEach(c => { (c as HTMLElement).style.opacity = "0"; });
        h1.style.opacity = "0";
      } else {
        h1.style.opacity = "1";
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <>
      {/* ══ DESKTOP ══ */}
      <section className="sc-desktop" ref={deskSectionRef}>
        <div className="sc-colorbends-bg" />
        <div className="sc-header" ref={deskHeaderRef}>
          <h1>Ready to work smarter? Meet Nokk.</h1>
        </div>
        <CardList refs={deskCardsRef} />
      </section>

      {/* ══ MOBILE ══ */}
      <div className="sc-mobile-wrap" ref={mobWrapRef}>
        <div className="sc-mobile-inner" ref={mobInnerRef}>
          <div className="sc-colorbends-bg" />
          <div className="sc-glass-overlay" />
          <div className="sc-mob-header" ref={mobHeaderRef}>
            <h1>Ready to work smarter? Meet Nokk.</h1>
          </div>
          <CardList refs={mobCardsRef} />
        </div>
      </div>

      {/* ══ CONTACT ══ */}
      <ContactSection />
    </>
  );
}
"use client";
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function Eye({ size = 200 }: { size?: number }) {
  const eyeRef = useRef<HTMLDivElement>(null);
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [mounted, setMounted] = useState(false);

  const w = size;
  const h = size * 0.5;
  const cx = w / 2;
  const cy = h / 2;
  const irisR = h * 0.41;
  const pupilR = irisR * 0.42;

  const fiberAngles = Array.from({ length: 20 }, (_, i) => (i / 20) * Math.PI * 2);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!eyeRef.current) return;
      const rect = eyeRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const angle = Math.atan2(dy, dx);
      const maxDist = irisR * 0.3;
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.05, maxDist);
      setPupilPos({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [irisR]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 3500;
      timeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 350);
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  if (!mounted) return null;

  const almondFull = `M ${w*0.04},${cy} Q ${cx},${-h*0.42} ${w*0.96},${cy} Q ${cx},${h*1.42} ${w*0.04},${cy}`;
  const closedLine = `M ${w*0.04},${cy} Q ${cx},${cy*1.08} ${w*0.96},${cy}`;

  return (
    <div
      ref={eyeRef}
      style={{
        width: w,
        height: h,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      >
        <defs>
          <clipPath id="almondClip">
            <path d={almondFull} />
          </clipPath>

          {/* Sclera — unchanged */}
          <radialGradient id="scleraGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="100%" stopColor="#c8daf2" />
          </radialGradient>

          {/* Iris — soft muted anime blue */}
          <radialGradient id="irisGrad" cx="46%" cy="32%" r="68%">
            <stop offset="0%"   stopColor="#d4eeff" />
            <stop offset="18%"  stopColor="#6aa8d8" />
            <stop offset="40%"  stopColor="#2b60a8" />
            <stop offset="65%"  stopColor="#173870" />
            <stop offset="85%"  stopColor="#0a1f45" />
            <stop offset="100%" stopColor="#030c20" />
          </radialGradient>

          {/* Limbal dark edge */}
          <radialGradient id="limbalGrad" cx="50%" cy="50%" r="50%">
            <stop offset="58%"  stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,15,0.90)" />
          </radialGradient>

          {/* Shimmer ring around pupil */}
          <radialGradient id="shimmerRing" cx="50%" cy="42%" r="54%">
            <stop offset="0%"   stopColor="rgba(0,0,0,0)" />
            <stop offset="50%"  stopColor="rgba(0,0,0,0)" />
            <stop offset="65%"  stopColor="rgba(90,160,220,0.20)" />
            <stop offset="76%"  stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Lower dreamy blue pool */}
          <radialGradient id="lowerShimmer" cx="50%" cy="88%" r="42%">
            <stop offset="0%"   stopColor="rgba(90,170,230,0.25)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Upper soft sheen */}
          <radialGradient id="upperSheen" cx="38%" cy="10%" r="46%">
            <stop offset="0%"   stopColor="rgba(200,235,255,0.18)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>

          {/* Ambient — unchanged */}
          <radialGradient id="ambientGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#4988C4" stopOpacity="0.5"/>
            <stop offset="55%"  stopColor="#0F2854" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>

          <filter id="irisGlow">
            <feGaussianBlur stdDeviation="2.5" result="b"/>
            <feMerge>
              <feMergeNode in="b"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="highlightBloom">
            <feGaussianBlur stdDeviation="0.8" result="b"/>
            <feMerge>
              <feMergeNode in="b"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Outline glow */}
          <filter id="outlineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feFlood floodColor="rgba(73,136,196,0.7)" result="color"/>
            <feComposite in="color" in2="blur" operator="in" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Ambient glow — unchanged */}
        <ellipse cx={cx} cy={cy} rx={w*0.52} ry={h*0.9}
          fill="url(#ambientGrad)"
          style={{ filter:'blur(18px)' }}
        />

        {/* Eye open contents */}
        <motion.g
          clipPath="url(#almondClip)"
          animate={{ opacity: isBlinking ? 0 : 1 }}
          transition={{ duration: 0.06 }}
        >
          {/* Sclera — unchanged */}
          <ellipse cx={cx} cy={cy} rx={w*0.46} ry={h*0.88} fill="url(#scleraGrad)" />

          {/* Vein hints — unchanged */}
          <line x1={w*0.1} y1={cy} x2={w*0.26} y2={cy*0.72} stroke="#4988C4" strokeWidth="0.5" opacity="0.25"/>
          <line x1={w*0.9} y1={cy} x2={w*0.74} y2={cy*0.78} stroke="#4988C4" strokeWidth="0.5" opacity="0.2"/>

          {/* Iris — anime layered */}
          <circle cx={cx} cy={cy} r={irisR} fill="url(#irisGrad)" filter="url(#irisGlow)" />

          {/* Fiber lines — unchanged */}
          {fiberAngles.map((angle, i) => (
            <line key={i}
              x1={cx + Math.cos(angle) * pupilR * 1.1}
              y1={cy + Math.sin(angle) * pupilR * 1.1}
              x2={cx + Math.cos(angle) * irisR * 0.9}
              y2={cy + Math.sin(angle) * irisR * 0.9}
              stroke="rgba(73,136,196,0.18)"
              strokeWidth="0.8"
            />
          ))}

          {/* Shimmer overlays */}
          <circle cx={cx} cy={cy} r={irisR} fill="url(#shimmerRing)" />
          <circle cx={cx} cy={cy} r={irisR} fill="url(#lowerShimmer)" />
          <circle cx={cx} cy={cy} r={irisR} fill="url(#upperSheen)" />

          {/* Limbal dark edge */}
          <circle cx={cx} cy={cy} r={irisR} fill="url(#limbalGrad)" />

          {/* Pupil + anime highlights */}
          <motion.g
            animate={{ x: pupilPos.x, y: pupilPos.y }}
            transition={{ type:'spring', stiffness:90, damping:20 }}
          >
            {/* Pupil — slightly oval, deep black */}
            <ellipse
              cx={cx} cy={cy + pupilR*0.05}
              rx={pupilR*0.88} ry={pupilR}
              fill="#010208"
            />

            {/* Soft pupil halo */}
            <ellipse
              cx={cx} cy={cy + pupilR*0.05}
              rx={pupilR*0.88} ry={pupilR}
              fill="none"
              stroke="rgba(60,130,220,0.16)"
              strokeWidth={pupilR * 0.18}
            />

            {/* Primary large rectangle highlight — anime sparkle */}
            <rect
              x={cx - pupilR*0.78} y={cy - irisR*0.50}
              width={pupilR*0.82} height={pupilR*0.46}
              rx={pupilR*0.14}
              fill="rgba(255,255,255,0.94)"
              filter="url(#highlightBloom)"
            />

            {/* Secondary small rectangle */}
            <rect
              x={cx + pupilR*0.20} y={cy - irisR*0.42}
              width={pupilR*0.30} height={pupilR*0.20}
              rx={pupilR*0.08}
              fill="rgba(255,255,255,0.80)"
            />

            {/* Crescent bottom glow */}
            <path
              d={`M ${cx - pupilR*0.28},${cy + pupilR*0.62} Q ${cx},${cy + pupilR*0.82} ${cx + pupilR*0.28},${cy + pupilR*0.62}`}
              fill="none"
              stroke="rgba(140,200,255,0.40)"
              strokeWidth={pupilR * 0.13}
              strokeLinecap="round"
            />

            {/* Sparkle dot bottom right */}
            <circle
              cx={cx + pupilR*0.46} cy={cy + pupilR*0.48}
              r={pupilR*0.10}
              fill="rgba(255,255,255,0.45)"
            />

            {/* Micro sparkle top right */}
            <circle
              cx={cx + pupilR*0.58} cy={cy - irisR*0.28}
              r={pupilR*0.06}
              fill="rgba(190,230,255,0.55)"
            />
          </motion.g>
        </motion.g>

        {/* Closed eye line — unchanged */}
        <motion.path
          d={closedLine}
          fill="none"
          stroke="#4988C4"
          strokeWidth="2"
          strokeLinecap="round"
          animate={{ opacity: isBlinking ? 1 : 0 }}
          transition={{ duration: 0.06 }}
        />

        {/* Eye outline — glow layer + crisp ink layer */}
        <motion.path
          d={almondFull}
          fill="none"
          stroke="rgba(73,136,196,0.35)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ opacity: isBlinking ? 0 : 1 }}
          style={{ filter: 'blur(3px)' }}
        />
        <motion.path
          d={almondFull}
          fill="none"
          stroke="#0a1628"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ opacity: isBlinking ? 0 : 1 }}
          filter="url(#outlineGlow)"
        />

        {/* Top lashes — unchanged */}
        {[0.16, 0.27, 0.38, 0.5, 0.62, 0.73, 0.84].map((t, i) => {
          const lx = w * t;
          const ly = cy - h * 0.7 * Math.sin(Math.PI * t);
          const tilt = (t - 0.5) * 52;
          const len = i === 3 ? 17 : 12;
          return (
            <line key={i}
              x1={lx} y1={ly}
              x2={lx + Math.sin((tilt * Math.PI) / 180) * len}
              y2={ly - Math.cos((tilt * Math.PI) / 180) * len}
              stroke="#ffffff"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          );
        })}

        {/* Bottom lashes — unchanged */}
        {[0.3, 0.5, 0.7].map((t, i) => {
          const lx = w * t;
          const ly = cy + h * 0.62 * Math.sin(Math.PI * t);
          return (
            <line key={i}
              x1={lx} y1={ly} x2={lx} y2={ly + 5}
              stroke="#ebecec" strokeWidth="0.9"
              strokeLinecap="round" opacity="0.4"
            />
          );
        })}
      </svg>
    </div>
  );
}
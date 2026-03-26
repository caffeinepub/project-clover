import { motion } from "motion/react";
import { useEffect, useState } from "react";

const CLOVER_POSITIONS = [
  { x: "10%", y: "15%", size: 40, delay: 0, duration: 2.8, id: "c1" },
  { x: "85%", y: "10%", size: 55, delay: 0.2, duration: 3.2, id: "c2" },
  { x: "5%", y: "70%", size: 35, delay: 0.4, duration: 2.5, id: "c3" },
  { x: "90%", y: "75%", size: 48, delay: 0.1, duration: 3.0, id: "c4" },
  { x: "50%", y: "5%", size: 30, delay: 0.6, duration: 2.7, id: "c5" },
  { x: "20%", y: "88%", size: 42, delay: 0.3, duration: 2.9, id: "c6" },
  { x: "75%", y: "85%", size: 38, delay: 0.5, duration: 3.1, id: "c7" },
];

const SPARKLE_POSITIONS = [
  { x: "30%", y: "30%", delay: 0.8, id: "s1" },
  { x: "65%", y: "25%", delay: 1.0, id: "s2" },
  { x: "20%", y: "55%", delay: 0.6, id: "s3" },
  { x: "78%", y: "50%", delay: 1.2, id: "s4" },
  { x: "45%", y: "70%", delay: 0.9, id: "s5" },
  { x: "55%", y: "15%", delay: 1.1, id: "s6" },
  { x: "12%", y: "40%", delay: 0.7, id: "s7" },
  { x: "88%", y: "35%", delay: 1.3, id: "s8" },
];

function Sparkle({ x, y, delay }: { x: string; y: string; delay: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        rotate: [0, 180],
      }}
      transition={{
        delay,
        duration: 1.2,
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay: 1.5,
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
      >
        <title>sparkle</title>
        <path
          d="M10 0L11.5 8.5L20 10L11.5 11.5L10 20L8.5 11.5L0 10L8.5 8.5L10 0Z"
          fill="oklch(0.82 0.16 85 / 0.7)"
        />
      </svg>
    </motion.div>
  );
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  const dismiss = () => {
    if (!exiting) {
      setExiting(true);
      setTimeout(onDone, 600);
    }
  };

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 2600);
    const doneTimer = setTimeout(onDone, 3200);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
      style={{ background: "oklch(0.06 0.04 280)" }}
      animate={exiting ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      onClick={dismiss}
    >
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0.2] }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.5 0.14 85 / 0.35), transparent)",
        }}
      />

      {/* Floating ambient clovers */}
      {CLOVER_POSITIONS.map((c) => (
        <motion.div
          key={c.id}
          className="absolute pointer-events-none select-none"
          style={{ left: c.x, top: c.y, fontSize: c.size }}
          initial={{ opacity: 0, rotate: 0, y: 20 }}
          animate={{
            opacity: [0, 0.7, 0.5, 0.7],
            rotate: [0, 360],
            y: [20, -10, 20],
          }}
          transition={{
            delay: c.delay,
            duration: c.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          🍀
        </motion.div>
      ))}

      {/* Sparkles */}
      {SPARKLE_POSITIONS.map((s) => (
        <Sparkle key={s.id} x={s.x} y={s.y} delay={s.delay} />
      ))}

      {/* Main clover */}
      <motion.div
        className="text-9xl mb-6 select-none"
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{ scale: [0, 1.3, 1], rotate: [-180, 20, 0], opacity: 1 }}
        transition={{ duration: 0.9, ease: "backOut" }}
        style={{ filter: "drop-shadow(0 0 30px oklch(0.82 0.16 85 / 0.9))" }}
      >
        🍀
      </motion.div>

      {/* Glow ring around main clover */}
      <motion.div
        className="absolute pointer-events-none rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.5, 2.2], opacity: [0, 0.6, 0] }}
        transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
        style={{
          width: 160,
          height: 160,
          background:
            "radial-gradient(circle, oklch(0.65 0.16 85 / 0.5), transparent 70%)",
          marginTop: -280,
        }}
      />

      {/* Ready to Party text */}
      <motion.h1
        className="text-center leading-tight"
        style={{
          fontFamily: "'Cinzel', Georgia, serif",
          fontSize: "clamp(2.5rem, 8vw, 5rem)",
          fontWeight: 800,
          color: "oklch(0.95 0.02 85)",
          textShadow:
            "0 0 40px oklch(0.65 0.16 85 / 0.8), 0 0 80px oklch(0.55 0.14 85 / 0.4)",
          letterSpacing: "0.05em",
        }}
        initial={{ opacity: 0, y: 30, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.7, ease: "backOut" }}
      >
        Ready to Party
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="mt-3 text-lg tracking-widest uppercase"
        style={{
          color: "oklch(0.65 0.14 85)",
          letterSpacing: "0.25em",
          fontFamily: "'Raleway', sans-serif",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.6 }}
      >
        🍀 Project Clover 🍀
      </motion.p>

      {/* Tap to skip hint */}
      <motion.p
        className="absolute bottom-10 text-xs uppercase tracking-widest"
        style={{
          color: "oklch(0.45 0.1 85)",
          fontFamily: "'Raleway', sans-serif",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0.5] }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        Tap to skip
      </motion.p>

      {/* Bottom shimmer bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.55 0.14 85), oklch(0.82 0.16 85), oklch(0.55 0.14 85))",
        }}
        initial={{ scaleX: 0, transformOrigin: "left" }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 2.4, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

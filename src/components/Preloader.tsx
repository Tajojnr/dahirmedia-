"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { sound } from "@/lib/sound";

const TICKS = 60;
const MESSAGES = [
  "INITIALIZING SENSOR MATRIX...",
  "CALIBRATING ANAMORPHIC GLASS...",
  "SYNCHRONIZING EXPOSURE PROFILE...",
  "OPTICAL ENGINE READY",
];

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const reduceMotion = useReducedMotion();
  const reduce = !!reduceMotion;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            sound.playShutter();
            setVisible(false);
            setTimeout(onComplete, 600);
          }, 300);
          return 100;
        }
        return prev + Math.floor(Math.random() * 8) + 3;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [onComplete]);

  const clamped = Math.min(progress, 100);
  const stage = progress < 30 ? 0 : progress < 70 ? 1 : progress < 100 ? 2 : 3;
  const litTicks = Math.round((clamped / 100) * TICKS);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          exit={{ opacity: 0, scale: 1.04, filter: reduce ? "blur(0px)" : "blur(10px)" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-obsidian text-parchment"
        >
          {/* Ambient layers: grid, glow, scanlines, vignette */}
          <div aria-hidden className="pointer-events-none absolute inset-0 hud-grid opacity-20" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(40% 40% at 50% 50%, rgba(212,175,55,0.10), transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, rgba(255,255,255,1) 0, rgba(255,255,255,1) 1px, transparent 1px, transparent 3px)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)",
            }}
          />

          {/* Screen corner brackets */}
          {[
            "top-4 left-4 border-t border-l",
            "top-4 right-4 border-t border-r",
            "bottom-4 left-4 border-b border-l",
            "bottom-4 right-4 border-b border-r",
          ].map((pos, i) => (
            <motion.span
              key={pos}
              aria-hidden
              className={`pointer-events-none absolute h-5 w-5 border-champagne/50 ${pos}`}
              initial={reduce ? false : { opacity: 0, scale: 1.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}

          {/* Top HUD Specs */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="absolute top-8 left-8 right-8 flex justify-between font-mono text-[10px] tracking-widest text-white/40 uppercase"
          >
            <span>DAHIR OPTICAL SYSTEM // VER 2.4</span>
            <span className="text-filmRed flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-filmRed animate-ping" />
              SYSTEM CALIBRATION
            </span>
          </motion.div>

          {/* Aperture Mechanical Graphic */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-40 h-40 flex items-center justify-center mb-8"
          >
            {/* Progress tick ring */}
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              className="absolute -inset-4 h-[calc(100%+2rem)] w-[calc(100%+2rem)]"
            >
              {Array.from({ length: TICKS }).map((_, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="1.5"
                  x2="50"
                  y2={i % 5 === 0 ? "6" : "4"}
                  transform={`rotate(${(i * 360) / TICKS} 50 50)`}
                  strokeWidth={i % 5 === 0 ? 0.7 : 0.4}
                  strokeLinecap="round"
                  className="transition-colors duration-150"
                  stroke={i < litTicks ? "#d4af37" : "rgba(255,255,255,0.15)"}
                />
              ))}
            </svg>

            <svg
              viewBox="0 0 100 100"
              className={`w-full h-full text-champagne/40 ${
                reduce ? "" : "animate-[spin_8s_linear_infinite]"
              }`}
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="0.75"
                fill="none"
                strokeDasharray="4 6"
              />
              <circle
                cx="50"
                cy="50"
                r="30"
                stroke="currentColor"
                strokeWidth="0.5"
                fill="none"
              />
            </svg>

            {/* Aperture Blades */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-16 h-16 rounded-full border border-champagne/60 shadow-[0_0_40px_rgba(212,175,55,0.25)] transition-all duration-300"
                style={{
                  transform: `scale(${0.3 + (progress / 100) * 0.7})`,
                }}
              />
            </div>

            <div className="absolute font-mono text-xs tracking-wider text-parchment tabular-nums">
              {Math.min(progress, 100)}%
            </div>
          </motion.div>

          {/* Telemetry Log */}
          <div className="relative font-mono text-[11px] tracking-widest text-white/50 uppercase text-center space-y-1">
            <div className="relative h-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={stage}
                  initial={reduce ? false : { opacity: 0, y: 6, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduce ? undefined : { opacity: 0, y: -6, filter: "blur(4px)" }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={stage === 3 ? "text-champagne" : undefined}
                >
                  {MESSAGES[stage]}
                  {stage < 3 && (
                    <motion.span
                      aria-hidden
                      className="ml-0.5 inline-block"
                      animate={reduce ? undefined : { opacity: [1, 0, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                    >
                      _
                    </motion.span>
                  )}
                </motion.p>
              </AnimatePresence>
            </div>
            <motion.p
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-[9px] text-champagne/70"
            >
              ƒ/1.2 • 35MM CINEMA PRIME
            </motion.p>
          </div>

          {/* Progress line */}
          <div
            aria-hidden
            className="absolute bottom-16 left-8 right-8 h-px bg-white/10"
          >
            <motion.div
              className="h-full origin-left bg-champagne shadow-[0_0_10px_rgba(212,175,55,0.8)]"
              animate={{ scaleX: clamped / 100 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            />
          </div>

          {/* Bottom HUD bar */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="absolute bottom-8 left-8 right-8 flex justify-between font-mono text-[10px] tracking-widest text-white/30 uppercase"
          >
            <span>DAHIR MEDIA</span>
            <span>KANO / ABUJA / GLOBAL</span>
          </motion.div>

          {/* Shutter flash on exit */}
          {!reduce && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              exit={{ opacity: [0, 0.9, 0] }}
              transition={{ duration: 0.45, times: [0, 0.2, 1], ease: "easeOut" }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
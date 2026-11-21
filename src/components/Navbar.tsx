"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { sound } from "@/lib/sound";

const EXPOSURES = [
  "ISO 100 · f/1.2",
  "ISO 200 · f/1.8",
  "ISO 400 · f/2.8",
  "ISO 800 · f/4",
];

export default function Navbar({ onOpenBooking }: { onOpenBooking: () => void }) {
  const [time, setTime] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [focused, setFocused] = useState(false);
  const [exposure, setExposure] = useState(0);

  const reduceMotion = useReducedMotion();
  const reduce = !!reduceMotion;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-GB", {
          timeZone: "Africa/Lagos",
          hour12: false,
        }) + " WAT"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  /* Scroll behaviour: compact + blur after leaving the top, hide on scroll down, return on scroll up */
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 24);
    setHidden(latest > prev && latest > 160);
  });

  /* Magnetic lean for the reserve button */
  const btnWrapRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 220, damping: 16, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 220, damping: 16, mass: 0.4 });

  const clockHead = (time || "12:00:00 WAT").slice(0, 7);
  const clockSecond = (time || "12:00:00 WAT").charAt(7);
  const clockTail = (time || "12:00:00 WAT").slice(8);

  return (
    <motion.header
      initial={reduce ? false : { y: "-100%" }}
      animate={{ y: hidden && !focused ? "-100%" : "0%" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 transition-[padding,background-color,backdrop-filter,border-color] duration-500 border-b ${
        scrolled
          ? "py-3 border-white/10 bg-black/70 backdrop-blur-xl"
          : "py-5 border-transparent bg-gradient-to-b from-black/90 via-black/40 to-transparent backdrop-blur-[2px]"
      }`}
    >
      <a
        href="#"
        onClick={() => sound.playTick()}
        className="group relative block h-12 w-48 md:w-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne"
      >
        <Image
          src="/branding/logo.webp"
          alt="Dahir Media"
          fill
          sizes="(max-width: 768px) 192px, 240px"
          priority
          className="object-contain object-left origin-left transition-all duration-500 ease-out group-hover:scale-[1.04] group-hover:brightness-125 group-active:scale-[0.98]"
        />
      </a>

      <div className="hidden lg:flex items-center gap-8 font-mono text-[11px] tracking-widest text-white/50 uppercase">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-filmRed animate-pulse" />
          <span className="text-white">REC [4K 60P]</span>
        </div>

        <div className="text-champagne tabular-nums whitespace-pre">
          {clockHead}
          <span className="relative inline-block overflow-hidden align-bottom">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={clockSecond}
                className="inline-block"
                initial={reduce ? false : { y: "-100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={reduce ? undefined : { y: "100%", opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                {clockSecond}
              </motion.span>
            </AnimatePresence>
          </span>
          {clockTail}
        </div>

        {/* Click to cycle exposure settings */}
        <button
          type="button"
          aria-label={`Exposure ${EXPOSURES[exposure]}. Press to change.`}
          onClick={() => {
            sound.playTick();
            setExposure((i) => (i + 1) % EXPOSURES.length);
          }}
          className="relative overflow-hidden px-1 py-0.5 text-white/50 uppercase tracking-widest transition-colors duration-300 hover:text-champagne focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={exposure}
              className="block"
              initial={reduce ? false : { y: 10, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={reduce ? undefined : { y: -10, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {EXPOSURES[exposure]}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <motion.div
          ref={btnWrapRef}
          style={{ x: sx, y: sy }}
          onPointerMove={(e) => {
            if (reduce || e.pointerType !== "mouse" || !btnWrapRef.current) return;
            const r = btnWrapRef.current.getBoundingClientRect();
            mx.set((e.clientX - (r.left + r.width / 2)) * 0.25);
            my.set((e.clientY - (r.top + r.height / 2)) * 0.25);
          }}
          onPointerLeave={() => {
            mx.set(0);
            my.set(0);
          }}
        >
          <motion.button
            whileTap={reduce ? undefined : { scale: 0.95 }}
            onClick={() => {
              sound.playShutter();
              onOpenBooking();
            }}
            className="group relative px-5 py-2.5 overflow-hidden rounded-full border border-champagne/40 bg-obsidian/60 backdrop-blur-md font-mono text-[11px] tracking-widest text-parchment uppercase transition-all duration-300 hover:border-champagne hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne"
          >
            <span className="relative z-10 flex items-center gap-2 text-champagne group-hover:text-black transition-colors duration-300">
              <span>RESERVE DATE</span>
              <span className="relative flex h-1.5 w-1.5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-champagne opacity-0 group-hover:animate-ping group-hover:bg-black" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-champagne transition-transform duration-300 group-hover:scale-125 group-hover:bg-black" />
              </span>
            </span>
            <span className="absolute inset-0 -translate-x-full bg-champagne transition-transform duration-300 ease-out group-hover:translate-x-0" />
          </motion.button>
        </motion.div>
      </div>

      {/* Scroll progress line */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px origin-left bg-champagne shadow-[0_0_8px_rgba(212,175,55,0.7)]"
        style={{ scaleX: progress }}
      />
    </motion.header>
  );
}
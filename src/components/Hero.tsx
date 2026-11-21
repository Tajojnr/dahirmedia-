"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { sound } from "@/lib/sound";

type Bezier = [number, number, number, number];
const EASE_OUT: Bezier = [0.22, 1, 0.36, 1];
const EASE_CURTAIN: Bezier = [0.76, 0, 0.24, 1];

/* -------------------------------------------------------------------------- */
/*  Running timecode (HH:MM:SS:FF) for the viewfinder                          */
/* -------------------------------------------------------------------------- */
function Timecode() {
  const [ms, setMs] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => setMs(performance.now() - start), 41);
    return () => window.clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const totalSeconds = Math.floor(ms / 1000);
  const frames = Math.floor((ms % 1000) / (1000 / 24));
  const tc = `${pad(Math.floor(totalSeconds / 3600))}:${pad(
    Math.floor((totalSeconds % 3600) / 60)
  )}:${pad(totalSeconds % 60)}:${pad(frames)}`;

  return <span className="tabular-nums">{tc}</span>;
}

/* -------------------------------------------------------------------------- */
/*  Rack-focus word reveal for the headline                                    */
/* -------------------------------------------------------------------------- */
function RevealWords({
  text,
  delay = 0,
  shimmer = false,
  reduce,
}: {
  text: string;
  delay?: number;
  shimmer?: boolean;
  reduce: boolean;
}) {
  const words = text.split(" ");

  return (
    <span className="block">
      {words.map((word, i) => (
        <span key={`${word}-${i}`}>
          <span className="inline-block overflow-hidden align-bottom px-[0.08em] -mx-[0.08em] pb-[0.1em] -mb-[0.1em]">
            <motion.span
              className="inline-block"
              initial={reduce ? false : { y: "110%", filter: "blur(10px)" }}
              animate={{ y: "0%", filter: "blur(0px)" }}
              transition={{
                duration: 1.2,
                delay: delay + i * 0.14,
                ease: EASE_OUT,
              }}
            >
              <motion.span
                className="inline-block"
                style={
                  shimmer
                    ? {
                        backgroundImage:
                          "linear-gradient(110deg, #d4af37 35%, #fff1b8 50%, #d4af37 65%)",
                        backgroundSize: "250% 100%",
                        backgroundPosition: "0% 0",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                      }
                    : undefined
                }
                animate={
                  shimmer && !reduce
                    ? { backgroundPosition: ["0% 0", "100% 0"] }
                    : undefined
                }
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                  delay: delay + 1.6,
                }}
              >
                {word}
              </motion.span>
            </motion.span>
          </span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Magnetic wrapper: element leans toward the cursor                          */
/* -------------------------------------------------------------------------- */
function Magnetic({
  children,
  strength = 0.28,
  reduce,
  onHover,
}: {
  children: ReactNode;
  strength?: number;
  reduce: boolean;
  onHover?: (hovering: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      className="w-full sm:w-auto"
      onPointerEnter={(e) => e.pointerType === "mouse" && onHover?.(true)}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
        onHover?.(false);
      }}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero                                                                       */
/* -------------------------------------------------------------------------- */
export default function Hero({ onOpenBooking }: { onOpenBooking: () => void }) {
  const reduceMotion = useReducedMotion();
  const reduce = !!reduceMotion;

  const sectionRef = useRef<HTMLElement>(null);
  const [reticleOn, setReticleOn] = useState(false);
  const [locked, setLocked] = useState(false);
  const [flash, setFlash] = useState(0);

  /* Pointer tracking (px for reticle/glow, normalised for parallax) */
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);

  const reticleX = useSpring(px, { stiffness: 260, damping: 28, mass: 0.5 });
  const reticleY = useSpring(py, { stiffness: 260, damping: 28, mass: 0.5 });
  const glowX = useSpring(px, { stiffness: 80, damping: 20, mass: 0.8 });
  const glowY = useSpring(py, { stiffness: 80, damping: 20, mass: 0.8 });
  const nxs = useSpring(nx, { stiffness: 50, damping: 18 });
  const nys = useSpring(ny, { stiffness: 50, damping: 18 });

  const glow = useMotionTemplate`radial-gradient(520px circle at ${glowX}px ${glowY}px, rgba(212,175,55,0.13), transparent 65%)`;

  const videoX = useTransform(nxs, (v) => v * -26);
  const videoY = useTransform(nys, (v) => v * -16);
  const contentX = useTransform(nxs, (v) => v * 12);

  /* Scroll-linked depth */
  const { scrollY } = useScroll();
  const bgScrollY = useTransform(scrollY, [0, 800], [0, reduce ? 0 : 160]);
  const contentY = useTransform(scrollY, [0, 600], [0, reduce ? 0 : -70]);
  const contentOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const hintOpacity = useTransform(scrollY, [0, 140], [1, 0]);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || reduce || !sectionRef.current) return;
    const r = sectionRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    px.set(x);
    py.set(y);
    nx.set(x / r.width - 0.5);
    ny.set(y / r.height - 0.5);
  };

  return (
    <section
      ref={sectionRef}
      onPointerEnter={(e) => e.pointerType === "mouse" && !reduce && setReticleOn(true)}
      onPointerLeave={() => {
        setReticleOn(false);
        setLocked(false);
        nx.set(0);
        ny.set(0);
      }}
      onPointerMove={handlePointerMove}
      className="relative h-screen w-full overflow-hidden bg-obsidian flex items-center justify-center"
    >
      {/* Background Cinematic Video Loop */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ y: bgScrollY }}
        initial={reduce ? false : { opacity: 0, scale: 1.12 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2.6, ease: EASE_OUT }}
      >
        <motion.div className="absolute -inset-[4%]" style={{ x: videoX, y: videoY }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-60 scale-105 filter brightness-90 contrast-105"
          >
            <source src="/videos/hero.mp4" type="video/mp4" />
          </video>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/20 to-obsidian/60" />
        <div className="absolute inset-0 hud-grid opacity-40 pointer-events-none" />
      </motion.div>

      {/* Cursor-following light leak */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[5] mix-blend-screen"
        style={{ background: glow }}
        animate={{ opacity: reticleOn ? 1 : 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* Viewfinder Frame Corner Brackets */}
      <motion.div
        className="pointer-events-none absolute inset-8 md:inset-14 border border-white/10 z-10"
        initial={reduce ? false : { opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, delay: 0.9, ease: EASE_OUT }}
      >
        <span className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-champagne" />
        <span className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-champagne" />
        <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-champagne" />
        <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-champagne" />

        {/* REC indicator + running timecode */}
        <div className="absolute top-4 left-4 flex items-center gap-2 font-mono text-[10px] tracking-widest text-white/50 uppercase">
          <motion.span
            className="block h-1.5 w-1.5 rounded-full bg-red-500"
            animate={reduce ? undefined : { opacity: [1, 0.15, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <span>REC</span>
          <span className="hidden sm:inline text-white/30">|</span>
          <span className="hidden sm:inline">
            <Timecode />
          </span>
        </div>

        {/* Viewfinder Exif Data */}
        <div className="absolute bottom-4 left-4 font-mono text-[10px] tracking-widest text-white/40 uppercase hidden sm:block">
          ANAMORPHIC CINE LENS // 2.39:1 CROP
        </div>
        <div className="absolute bottom-4 right-4 font-mono text-[10px] tracking-widest text-white/40 uppercase hidden sm:block">
          SHUTTER: 1/120s • WB: 5600K
        </div>
      </motion.div>

      {/* Hero Typography & Statement */}
      <motion.div
        className="relative z-20 max-w-5xl mx-auto px-6 text-center flex flex-col items-center"
        style={{ y: contentY, x: contentX, opacity: contentOpacity }}
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 1.0, ease: EASE_OUT }}
          className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-champagne/30 bg-black/40 backdrop-blur-md font-mono text-[10px] md:text-xs tracking-widest text-champagne uppercase"
        >
          <span>CINEMATOGRAPHY</span>
          <span>•</span>
          <span>ROYAL NUPTIALS</span>
          <span>•</span>
          <span>HAUTE COUTURE</span>
        </motion.div>

        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight leading-[0.92] text-parchment">
          <RevealWords text="Moments Made" delay={1.15} reduce={reduce} />
          <span className="block italic font-normal text-champagne">
            <RevealWords text="Monumental." delay={1.45} shimmer reduce={reduce} />
          </span>
        </h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, delay: 1.9, ease: EASE_OUT }}
          className="mt-6 md:mt-8 max-w-xl font-sans text-sm md:text-base text-parchment/70 font-light leading-relaxed tracking-wide"
        >
          High-culture documentary photography and bespoke cinematography for royal ceremonies, editorial portraits, and timeless heritage.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2.2, ease: EASE_OUT }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Magnetic reduce={reduce} onHover={setLocked}>
            <motion.button
              whileTap={reduce ? undefined : { scale: 0.96 }}
              onClick={() => {
                sound.playShutter();
                setFlash((n) => n + 1);
                onOpenBooking();
              }}
              className="group relative overflow-hidden w-full sm:w-auto px-8 py-4 bg-champagne text-black font-mono text-xs tracking-widest uppercase font-semibold transition-all duration-300 hover:bg-champagne-light hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-full w-full -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[250%]"
              />
              <span className="relative">Commission Project</span>
            </motion.button>
          </Magnetic>

          <Magnetic reduce={reduce} strength={0.2} onHover={setLocked}>
            <motion.a
              href="#apparatus"
              whileTap={reduce ? undefined : { scale: 0.97 }}
              onClick={() => sound.playTick()}
              className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 border border-white/20 bg-black/40 backdrop-blur-sm text-parchment font-mono text-xs tracking-widest uppercase transition-all duration-300 hover:border-champagne hover:text-champagne focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne"
            >
              <span>Explore Apparatus</span>
              <span
                aria-hidden
                className="inline-block transition-transform duration-300 group-hover:translate-y-1"
              >
                ↓
              </span>
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-px w-0 bg-champagne transition-all duration-500 group-hover:w-full"
              />
            </motion.a>
          </Magnetic>
        </motion.div>
      </motion.div>

      {/* Bottom Scroll Indicator */}
      <motion.div
        style={{ opacity: hintOpacity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 font-mono text-[9px] tracking-widest text-white/40 uppercase"
      >
        <span>SCROLL TO ENTER</span>
        <motion.div
          className="w-[1px] h-6 bg-gradient-to-b from-champagne to-transparent"
          style={{ transformOrigin: "top" }}
          animate={
            reduce
              ? undefined
              : { scaleY: [0, 1, 1], opacity: [1, 1, 0] }
          }
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.6, 1],
          }}
        />
      </motion.div>

      {/* Autofocus reticle that follows the cursor and locks onto buttons */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-[35] hidden md:block"
          style={{ x: reticleX, y: reticleY }}
          animate={{ opacity: reticleOn ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="-translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="relative"
              animate={{
                width: locked ? 44 : 72,
                height: locked ? 44 : 72,
                rotate: locked ? 90 : 0,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              <span
                className={`absolute left-0 top-0 h-2.5 w-2.5 border-l border-t transition-colors duration-200 ${
                  locked ? "border-champagne" : "border-white/60"
                }`}
              />
              <span
                className={`absolute right-0 top-0 h-2.5 w-2.5 border-r border-t transition-colors duration-200 ${
                  locked ? "border-champagne" : "border-white/60"
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l transition-colors duration-200 ${
                  locked ? "border-champagne" : "border-white/60"
                }`}
              />
              <span
                className={`absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r transition-colors duration-200 ${
                  locked ? "border-champagne" : "border-white/60"
                }`}
              />
              <span
                className={`absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-200 ${
                  locked ? "bg-champagne" : "bg-white/60"
                }`}
              />
            </motion.div>
            <div
              className={`absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] tracking-widest uppercase transition-colors duration-200 ${
                locked ? "text-champagne" : "text-white/50"
              }`}
            >
              {locked ? "AF LOCKED" : "AF-C"}
            </div>
          </div>
        </motion.div>
      )}

      {/* Cinematic curtain open (plays once on load) */}
      {!reduce && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-black"
            initial={{ height: "50%" }}
            animate={{ height: "0%" }}
            transition={{ duration: 1.5, delay: 0.15, ease: EASE_CURTAIN }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-black"
            initial={{ height: "50%" }}
            animate={{ height: "0%" }}
            transition={{ duration: 1.5, delay: 0.15, ease: EASE_CURTAIN }}
          />
        </>
      )}

      {/* Shutter flash when commissioning */}
      {flash > 0 && !reduce && (
        <motion.div
          key={flash}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-40 bg-white"
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
      )}
    </section>
  );
}
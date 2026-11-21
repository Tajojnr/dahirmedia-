"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sound } from "@/lib/sound";

/**
 * Same curve family the Preloader uses ([0.22, 1, 0.36, 1]) so scrolling
 * decelerates with the same "lens settling into focus" feel.
 */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sy = (u: number) => ((ay * u + by) * u + cy) * u;
  const dx = (u: number) => (3 * ax * u + 2 * bx) * u + cx;

  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i++) {
      const err = sx(u) - t;
      if (Math.abs(err) < 1e-5) return sy(u);
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u -= err / d;
    }
    let lo = 0, hi = 1;
    u = t;
    for (let i = 0; i < 20; i++) {
      const x = sx(u);
      if (Math.abs(x - t) < 1e-5) break;
      if (x < t) lo = u; else hi = u;
      u = (lo + hi) / 2;
    }
    return sy(u);
  };
}

const optical = cubicBezier(0.22, 1, 0.36, 1);

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

type Props = {
  children: React.ReactNode;
  /** Freeze scrolling while the Preloader is on screen. */
  locked?: boolean;
  /** Play a soft optical tick at each scroll detent (every 5%). */
  ticks?: boolean;
};

const DETENTS = 20;

export default function SmoothScroll({ children, locked = false, ticks = true }: Props) {
  const ticksRef = useRef(ticks);
  ticksRef.current = ticks;
  const lenisRef = useRef<Lenis | null>(null);
  const lockedRef = useRef(locked);
  const barRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);

  lockedRef.current = locked;

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    // Respect reduced motion: native scroll, but keep the progress hairline.
    const lenis = reduce
      ? null
      : new Lenis({
          duration: 1.4,
          easing: optical,
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          wheelMultiplier: 0.85,
          touchMultiplier: 1.6,
          anchors: { duration: 1.6, easing: optical } as never,
        });

    lenisRef.current = lenis;
    if (lenis && lockedRef.current) lenis.stop();

    // --- HUD: progress hairline + mono readout (direct DOM, no re-renders) ---
    const bar = barRef.current;
    const readout = readoutRef.current;
    const value = valueRef.current;
    let idle: gsap.core.Tween | null = null;

    const paint = (progress: number) => {
      const p = Math.min(1, Math.max(0, progress));
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (value) value.textContent = String(Math.round(p * 100)).padStart(3, "0");
      if (readout && fine) {
        gsap.to(readout, { opacity: 1, duration: 0.25, overwrite: true });
        idle?.kill();
        idle = gsap.to(readout, { opacity: 0, duration: 0.8, delay: 1.2, ease: "power2.out" });
      }
    };

    const nativeProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      paint(max > 0 ? window.scrollY / max : 0);
    };

    if (lenis) {
      let lastDetent = -1;
      let lastTickAt = 0;

      lenis.on("scroll", (l: Lenis) => {
        ScrollTrigger.update();
        paint(l.progress);

        // Optical tick each time we cross a detent; throttled so fast flicks stay clean.
        const detent = Math.floor(Math.min(1, Math.max(0, l.progress)) * DETENTS);
        if (lastDetent === -1) {
          lastDetent = detent;
        } else if (detent !== lastDetent) {
          lastDetent = detent;
          const now = performance.now();
          if (ticksRef.current && fine && !lockedRef.current && now - lastTickAt > 70) {
            lastTickAt = now;
            sound.playTick();
          }
        }
      });

      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const refresh = () => {
        lenis.resize();
        ScrollTrigger.refresh();
      };
      window.addEventListener("load", refresh);

      return () => {
        window.removeEventListener("load", refresh);
        idle?.kill();
        gsap.ticker.remove(tick);
        lenis.destroy();
        lenisRef.current = null;
      };
    }

    window.addEventListener("scroll", nativeProgress, { passive: true });
    return () => {
      window.removeEventListener("scroll", nativeProgress);
      idle?.kill();
    };
  }, []);

  // Hold scroll during the preloader, release when it hands off.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (locked) lenis.stop();
    else lenis.start();
  }, [locked]);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}

      {/* Progress hairline — mirrors the preloader's champagne progress line */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-px bg-white/10"
      >
        <div
          ref={barRef}
          className="h-full origin-left bg-champagne shadow-[0_0_10px_rgba(212,175,55,0.8)]"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* Mono HUD readout — appears while scrolling, fades when idle */}
      <div
        ref={readoutRef}
        aria-hidden
        className="pointer-events-none fixed bottom-6 right-6 z-[90] hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/40 opacity-0 md:flex"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-champagne/70" />
        <span>SCAN</span>
        <span ref={valueRef} className="tabular-nums text-champagne/80">
          000
        </span>
        <span>%</span>
      </div>
    </LenisContext.Provider>
  );
}
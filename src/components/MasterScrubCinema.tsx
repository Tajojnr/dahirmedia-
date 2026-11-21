"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sound } from "@/lib/sound";

const TOTAL_FRAMES = 120;
const FPS = 24;
const LOAD_CONCURRENCY = 8;

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")";

const pad = (n: number, len = 2) => String(n).padStart(len, "0");

const toTimecode = (frame: number) => {
  const f = Math.floor(frame);
  const seconds = Math.floor(f / FPS);
  return `00:${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}:${pad(f % FPS)}`;
};

export default function MasterScrubCinema() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const [loaded, setLoaded] = useState(0);
  const [isAnamorphic, setIsAnamorphic] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const frameLabelRef = useRef<HTMLSpanElement>(null);
  const timecodeRef = useRef<HTMLSpanElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);

  const ready = loaded > 10; // Begins displaying as soon as initial keyframes land

  // Image loading pool
  useEffect(() => {
    let loadedCount = 0;
    let activeLoads = 0;
    let nextFrame = 0;
    let cancelled = false;

    const loadNext = () => {
      while (!cancelled && activeLoads < LOAD_CONCURRENCY && nextFrame < TOTAL_FRAMES) {
        const index = nextFrame++;
        const img = new Image();
        img.decoding = "async";
        framesRef.current[index] = img;
        activeLoads++;

        const done = () => {
          if (cancelled) return;
          activeLoads--;
          loadedCount++;
          setLoaded(loadedCount);
          if (nextFrame < TOTAL_FRAMES) loadNext();
        };

        img.onload = done;
        img.onerror = done;
        img.src = `/sequences/cinema/frame_${String(index + 1).padStart(3, "0")}.webp`;
      }
    };

    loadNext();

    return () => {
      cancelled = true;
    };
  }, []);

  // ScrollTrigger initializes IMMEDIATELY on mount
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let sized = false;
    let lastRendered = -1;
    let holdTimer: number | undefined;

    const nearestLoaded = (target: number) => {
      if (framesRef.current[target]?.complete) return target;
      for (let d = 1; d < TOTAL_FRAMES; d++) {
        const b = target - d;
        const a = target + d;
        if (b >= 0 && framesRef.current[b]?.complete) return b;
        if (a < TOTAL_FRAMES && framesRef.current[a]?.complete) return a;
      }
      return -1;
    };

    const paintHud = (frame: number) => {
      const n = Math.min(Math.max(Math.floor(frame), 0), TOTAL_FRAMES - 1);
      const p = n / (TOTAL_FRAMES - 1);
      if (frameLabelRef.current) frameLabelRef.current.textContent = `FRAME ${pad(n + 1, 3)} / ${TOTAL_FRAMES}`;
      if (timecodeRef.current) timecodeRef.current.textContent = toTimecode(n);
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
      if (playheadRef.current) playheadRef.current.style.left = `${p * 100}%`;
    };

    const renderFrame = (frameIndex: number) => {
      const target = Math.min(Math.max(Math.floor(frameIndex), 0), TOTAL_FRAMES - 1);
      const actualIdx = nearestLoaded(target);
      if (actualIdx < 0 || actualIdx === lastRendered) {
        paintHud(target);
        return;
      }

      const img = framesRef.current[actualIdx];
      if (img && img.complete && img.naturalWidth > 0) {
        if (!sized) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          sized = true;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        lastRendered = actualIdx;
      }
      paintHud(target);
    };

    const frameObj = { frame: 0 };

    const st = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      // Generous 5x viewport travel distance locks the screen for intentional scrub
      end: () => `+=${window.innerHeight * 4.5}`,
      pin: true,
      pinSpacing: true,
      scrub: 1.2,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const targetFrame = self.progress * (TOTAL_FRAMES - 1);
        gsap.to(frameObj, {
          frame: targetFrame,
          duration: 0.15,
          overwrite: "auto",
          onUpdate: () => renderFrame(frameObj.frame),
        });

        if (stageRef.current) {
          const intro = Math.min(self.progress / 0.1, 1);
          gsap.set(stageRef.current, { scale: 0.94 + 0.06 * intro });
        }

        if (hintRef.current) {
          hintRef.current.style.opacity = self.progress > 0.02 ? "0" : "1";
        }

        if (speedRef.current) {
          const range = st.end - st.start;
          const framesPerSecond = (self.getVelocity() * (TOTAL_FRAMES - 1)) / range;
          const speed = framesPerSecond / FPS;
          const mag = Math.abs(speed);
          speedRef.current.textContent =
            mag < 0.05 ? "HOLD" : `${speed > 0 ? "PLAY >" : "< REV"} ${mag.toFixed(1)}x`;
          window.clearTimeout(holdTimer);
          holdTimer = window.setTimeout(() => {
            if (speedRef.current) speedRef.current.textContent = "HOLD";
          }, 160);
        }
      },
    });

    return () => {
      window.clearTimeout(holdTimer);
      st.kill();
    };
  }, []);

  // Film grain
  useEffect(() => {
    if (!ready || !grainRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = grainRef.current;
    const id = window.setInterval(() => {
      gsap.set(el, {
        x: Math.random() * 80 - 40,
        y: Math.random() * 80 - 40,
      });
    }, 90);

    return () => window.clearInterval(id);
  }, [ready]);

  const loadPct = Math.round((loaded / TOTAL_FRAMES) * 100);

  return (
    <section
      ref={containerRef}
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, rgba(212,175,55,0.08), transparent 70%)",
        }}
      />

      <div ref={stageRef} className="relative z-10 flex w-full items-center justify-center">
        <div
          className={`relative z-10 mx-auto flex w-full items-center justify-center overflow-hidden transition-all duration-700 ${
            isAnamorphic
              ? "aspect-[2.39/1] max-w-full border-y border-champagne/30"
              : "aspect-video max-w-7xl border border-white/10"
          }`}
        >
          <canvas
            ref={canvasRef}
            className="h-full w-full object-cover"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
            }}
          />

          <div
            aria-hidden="true"
            ref={grainRef}
            className="pointer-events-none absolute -inset-20 opacity-[0.07] mix-blend-overlay"
            style={{ backgroundImage: GRAIN }}
          />

          <span aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-champagne/80" />
          <span aria-hidden="true" className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-champagne/80" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-champagne/80" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-champagne/80" />

          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-white/50">
              <span>MASTER REEL // TIME-SCRUB ENGINE</span>
              <span className="tabular-nums text-champagne" ref={frameLabelRef}>
                FRAME 001 / {TOTAL_FRAMES}
              </span>
            </div>

            <div
              ref={hintRef}
              className="flex flex-col items-center gap-2 self-center font-mono text-[9px] uppercase tracking-widest text-white/60 transition-opacity duration-500"
            >
              <span>SCROLL TO SCRUB</span>
              <span className="block h-6 w-px animate-pulse bg-gradient-to-b from-champagne to-transparent" />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-end justify-between font-mono text-[10px] uppercase tracking-widest text-white/50">
                <div className="flex flex-col gap-1">
                  <span>RAW 4K 12-BIT LOG</span>
                  <span className="hidden gap-3 tabular-nums text-white/40 sm:flex">
                    <span ref={timecodeRef}>00:00:00:00</span>
                    <span ref={speedRef} className="text-champagne/80">
                      HOLD
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setIsAnamorphic(!isAnamorphic);
                  }}
                  className="group pointer-events-auto inline-flex items-center rounded bg-white/10 px-3 py-1 text-parchment transition-all duration-300 hover:bg-champagne hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne active:scale-95"
                >
                  <span
                    aria-hidden="true"
                    className={`mr-2 inline-block h-2 border border-current transition-all duration-500 ${
                      isAnamorphic ? "w-5" : "w-3.5"
                    }`}
                  />
                  ASPECT: {isAnamorphic ? "2.39:1 CINEMASCOPE" : "16:9 STANDARD"}
                </button>
              </div>

              <div className="relative h-4" aria-hidden="true">
                <div
                  className="absolute inset-x-0 bottom-0 h-2"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to right, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 1px, transparent 1px, transparent calc(100% / 24))",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 h-px bg-white/20" />
                <div
                  ref={fillRef}
                  className="absolute inset-x-0 bottom-0 h-px origin-left bg-champagne"
                  style={{ transform: "scaleX(0)" }}
                />
                <div
                  ref={playheadRef}
                  className="absolute bottom-0 top-0 w-px bg-champagne shadow-[0_0_10px_rgba(212,175,55,0.9)]"
                  style={{ left: "0%" }}
                >
                  <span className="absolute -top-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-champagne" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!ready && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-black font-mono text-[10px] uppercase tracking-widest text-white/60"
          aria-hidden={ready}
        >
          <span className="tabular-nums text-champagne">{pad(loadPct, 3)}%</span>
          <div className="h-px w-48 bg-white/15">
            <div
              className="h-full origin-left bg-champagne transition-transform duration-200"
              style={{ transform: `scaleX(${loaded / TOTAL_FRAMES})` }}
            />
          </div>
          <span>BUFFERING MASTER SEQUENCE</span>
        </div>
      )}
    </section>
  );
}
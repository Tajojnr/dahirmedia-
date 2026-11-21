"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const TOTAL_FRAMES = 120;
const CONCURRENCY = 8;
const framePath = (i: number) =>
  `/sequences/apparatus/frame_${String(i + 1).padStart(3, "0")}.webp`;

function buildLoadOrder(reduced: boolean): number[] {
  if (reduced) return [Math.floor(TOTAL_FRAMES * 0.6)];
  const seen = new Set<number>();
  const order: number[] = [];
  const add = (i: number) => {
    if (!seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };

  // The first and last frames always arrive first, so both ends of the scroll are correct
  add(0);
  add(TOTAL_FRAMES - 1);

  for (const stride of [30, 10, 4, 2, 1]) {
    for (let i = 0; i < TOTAL_FRAMES; i += stride) add(i);
  }
  return order;
}

export default function ApparatusCanvas() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [loadPercent, setLoadPercent] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const order = buildLoadOrder(reduced);

    const frames: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);
    const inflight = new Set<HTMLImageElement>();
    let target = reduced ? order[0] : 0;
    let lastDrawn = -1;
    let sized = false;
    let firstReported = false;
    let cancelled = false;
    let done = 0;
    let cursor = 0;

    const nearestLoaded = (t: number) => {
      if (frames[t]) return t;
      for (let d = 1; d < TOTAL_FRAMES; d++) {
        const before = t - d;
        const after = t + d;
        if (before >= 0 && frames[before]) return before;
        if (after < TOTAL_FRAMES && frames[after]) return after;
      }
      return -1;
    };

    const draw = (t: number) => {
      target = t;
      const idx = nearestLoaded(t);
      if (idx < 0 || idx === lastDrawn) return;
      const img = frames[idx];
      if (!img) return;

      if (!sized) {
        const w = Math.min(img.naturalWidth || 1920, 1920);
        const h = Math.round(w * ((img.naturalHeight || 1080) / (img.naturalWidth || 1920)));
        canvas.width = w;
        canvas.height = h;
        sized = true;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      lastDrawn = idx;
    };

    const pump = () => {
      if (cancelled || cursor >= order.length) return;
      const idx = order[cursor++];
      const img = new Image();
      img.decoding = "async";
      inflight.add(img);

      const finish = (ok: boolean) => {
        inflight.delete(img);
        if (cancelled) return;
        if (ok) {
          frames[idx] = img;
          draw(target);
          if (!firstReported) {
            firstReported = true;
            setReady(true);
          }
        }
        done++;
        setLoadPercent(Math.round((done / order.length) * 100));
        pump();
      };

      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = framePath(idx);
    };

    const start = () => {
      for (let i = 0; i < CONCURRENCY; i++) pump();
    };

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(start, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(start, 300);
    }

    let gsapCtx: gsap.Context | undefined;
    if (!reduced) {
      gsapCtx = gsap.context(() => {
        const frameObj = { frame: 0 };

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=400%",
            pin: true,
            scrub: 0.3, // Lenis already smooths the scroll, so this only needs a touch
            anticipatePin: 1,
            invalidateOnRefresh: true,
                      },
        });

        // The frames play across the first 80% of the pinned scroll
        tl.to(
          frameObj,
          {
            frame: TOTAL_FRAMES - 1,
            snap: { frame: 1 },
            duration: 0.8,
            onUpdate: () => draw(frameObj.frame),
          },
          0
        );

        // Callouts glide in early and are gone by the time the sequence ends
        tl.fromTo(
          "[data-callout]",
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.12, stagger: 0.05, ease: "power2.out" },
          0.04
        );
        tl.to(
          "[data-callout]",
          { autoAlpha: 0, y: -16, duration: 0.1, stagger: 0.04, ease: "power2.in" },
          0.66
        );

        tl.to("[data-progress]", { scaleX: 1, duration: 0.8 }, 0);

        // The hold: the finished camera stays pinned for the last 20% of the scroll
        tl.to({}, { duration: 0.2 }, 0.8);
      }, section);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      inflight.forEach((img) => {
        img.onload = null;
        img.onerror = null;
        img.src = "";
      });
      inflight.clear();
      gsapCtx?.revert();
    };
  }, []);

  return (
    <section
      id="apparatus"
      ref={sectionRef}
      aria-label="Optical apparatus: an exploded view of the studio camera"
      className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-obsidian"
    >
      <div className="hud-grid pointer-events-none absolute inset-0 opacity-30" />

      <div className="relative z-10 mx-auto flex aspect-video w-full max-w-6xl items-center justify-center px-4">
        {!ready && (
          <div className="absolute flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-champagne">
            <span className="h-2 w-2 animate-ping rounded-full bg-champagne" />
            LOADING OPTICAL APPARATUS ({loadPercent}%)
          </div>
        )}
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Exploded cinema camera and anamorphic lens, revealed as you scroll"
          className={`h-full w-full object-contain transition-opacity duration-700 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-8 top-24 z-20 flex justify-between md:inset-x-20">
        <div data-callout>
          <span className="font-mono text-[10px] uppercase tracking-widest text-champagne">
            01 // OPTICAL PRIME
          </span>
          <h3 className="font-display text-2xl font-light text-parchment md:text-3xl">
            Anamorphic Glass
          </h3>
          <p className="mt-1 max-w-xs font-mono text-[11px] text-white/50">
            Custom engineered elements capturing signature horizontal flare caustics and true skin luminance.
          </p>
        </div>

        <div data-callout className="text-right">
          <span className="font-mono text-[10px] uppercase tracking-widest text-champagne">
            02 // SENSOR CORE
          </span>
          <h3 className="font-display text-2xl font-light text-parchment md:text-3xl">
            Full-Frame 16-Bit RAW
          </h3>
          <p className="ml-auto mt-1 max-w-xs font-mono text-[11px] text-white/50">
            Uncompressed dynamic latitude engineered for opulent royal bridal velvets and evening twilight.
          </p>
        </div>
      </div>

      <div className="absolute bottom-10 left-8 right-8 z-20 flex items-end justify-between font-mono text-[10px] uppercase tracking-widest text-white/40 md:left-20 md:right-20">
        <div>
          DECONSTRUCTING APPARATUS // SCROLL TO EXAMINE
          {ready && loadPercent < 100 ? ` // SHARPENING ${loadPercent}%` : ""}
        </div>
        <div className="font-bold text-champagne">f/1.2 APERTURE DIAPHRAGM</div>
      </div>

      <div
        data-progress
        className="absolute inset-x-0 bottom-0 z-20 h-px origin-left scale-x-0 bg-champagne"
        aria-hidden="true"
      />
    </section>
  );
}
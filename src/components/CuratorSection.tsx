"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { sound } from "@/lib/sound";

const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const hoverOnly = "[@media(hover:hover)]";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne";

const STATS = [
  { to: 72, suffix: "K+", label: "Global audience" },
  { to: 500, suffix: "+", label: "Royal ceremonies" },
  { to: 100, suffix: "%", label: "Cinema standard" },
] as const;

const FOUNDER_SOCIALS = [
  {
    name: "LinkedIn",
    href: "https://ng.linkedin.com/in/aminu-dahiru-lawan-86538427a",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/dahirmedia/",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@dahirmedia?si=fD-RtsU6CwBhit74",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/2349027880069",
    icon: (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
      </svg>
    ),
  },
] as const;

/* ------------------------------------------------------------------ hooks */

function useInViewOnce<T extends Element>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

/* ------------------------------------------------------------- fragments */

function reveal(inView: boolean, delay: number) {
  return {
    className: `transition-[opacity,transform] duration-[900ms] ${ease} motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none ${
      inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
    }`,
    style: { transitionDelay: inView ? `${delay}ms` : "0ms" },
  };
}

function CountUp({ to, suffix, active }: { to: number; suffix: string; active: boolean }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }
    const duration = 1800;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, to]);

  return (
    <>
      <span className="sr-only">
        {to}
        {suffix}
      </span>
      <span aria-hidden="true" className="tabular-nums">
        {value}
        <span className="text-champagne">{suffix}</span>
      </span>
    </>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute h-4 w-4 border-champagne/60 transition-[width,height,border-color] duration-700 ${ease} motion-reduce:transition-none ${className}`}
    />
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 transition-transform duration-500 motion-reduce:transition-none ${hoverOnly}:group-hover:translate-x-1 ${ease}`}
    >
      <path
        d="M2 8h11M9 3.5 13.5 8 9 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

/* --------------------------------------------------------------- section */

export default function CuratorSection({ onOpenBooking }: { onOpenBooking: () => void }) {
  const [ref, inView] = useInViewOnce<HTMLElement>(0.15);

  return (
    <section
      ref={ref}
      aria-labelledby="curator-heading"
      className="relative w-full border-t border-white/10 bg-obsidian py-24 md:py-32 lg:py-40"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 md:px-12 lg:grid-cols-12 lg:gap-16">
        
        {/* Founder Viewfinder Video Cinema Reel */}
        <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <div
            className={`group relative flex w-full flex-col overflow-hidden border border-champagne/30 bg-obsidian-surface p-4 sm:p-5 ${reveal(inView, 0).className}`}
            style={reveal(inView, 0).style}
          >
            {/* Viewfinder Corners */}
            <Corner className="left-2 top-2 border-l border-t group-hover:h-6 group-hover:w-6 group-hover:border-champagne" />
            <Corner className="right-2 top-2 border-r border-t group-hover:h-6 group-hover:w-6 group-hover:border-champagne" />
            <Corner className="bottom-2 left-2 border-b border-l group-hover:h-6 group-hover:w-6 group-hover:border-champagne" />
            <Corner className="bottom-2 right-2 border-b border-r group-hover:h-6 group-hover:w-6 group-hover:border-champagne" />

            {/* Viewfinder Header Status */}
            <div className="relative z-10 mb-3 flex items-center justify-between px-2 pt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-champagne">
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-crimson" />
                REC // 24FPS
              </span>
              <span className="text-white/60">4K HDR MASTER</span>
            </div>

            {/* Embedded Muted Auto-Loop Short Video */}
            <div className="relative aspect-[9/14] w-full overflow-hidden rounded-sm bg-black sm:aspect-[9/13]">
              <iframe
                src="https://www.youtube-nocookie.com/embed/rt0BelYf2gk?autoplay=1&mute=1&loop=1&playlist=rt0BelYf2gk&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&iv_load_policy=3"
                title="Aminu Dahiru Lawan | Dahir Media Founder"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                className="pointer-events-none absolute inset-0 h-full w-full scale-[1.05] border-0 object-cover"
              />
              {/* Subtle cinema vignette gradient overlay */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"
              />
              
              {/* Video Overlay Founder Badge */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-champagne">
                  Founder & Lead Director
                </p>
                <h3 className="font-display text-lg font-light text-parchment">
                  Aminu Dahiru Lawan
                </h3>
              </div>
            </div>

            {/* Card Footer Details */}
            <div className="relative mt-4 flex items-center justify-between border-t border-white/10 px-2 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
              <span>Abuja / Kano</span>
              <span>Global Commissions</span>
            </div>
          </div>
        </div>

        {/* Copy & Vision */}
        <div className="flex flex-col justify-center lg:col-span-7">
          <p
            className={`flex items-center gap-4 font-mono text-xs uppercase tracking-[0.2em] text-champagne ${reveal(inView, 100).className}`}
            style={reveal(inView, 100).style}
          >
            <span aria-hidden="true" className="h-px w-10 bg-champagne" />
            Leadership & Vision
          </p>

          <h2
            id="curator-heading"
            className={`mt-5 font-display text-4xl font-light leading-[1.1] text-balance text-parchment sm:text-5xl lg:text-6xl ${reveal(inView, 200).className}`}
            style={reveal(inView, 200).style}
          >
            <span className="block">Preserving Cultural</span>
            <span className="block font-normal italic text-champagne">Sovereignty and Elegance.</span>
          </h2>

          <p
            className={`mt-6 max-w-xl font-sans text-base font-light leading-relaxed text-parchment/75 md:text-lg md:leading-relaxed ${reveal(inView, 300).className}`}
            style={reveal(inView, 300).style}
          >
            Under the creative direction of Aminu Dahiru Lawan, Dahir Media captures the majestic heritage of Northern Nigeria, royal ceremonies, high-profile nuptials, and documentary cinema worldwide. Through master-level lighting, large-format cinema sensors, and poetic framing, we translate fleeting occasions into timeless works of art.
          </p>

          {/* Social Profiles Grid */}
          <div
            className={`mt-6 flex flex-wrap items-center gap-3 ${reveal(inView, 350).className}`}
            style={reveal(inView, 350).style}
          >
            {FOUNDER_SOCIALS.map((soc) => (
              <a
                key={soc.name}
                href={soc.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sound.playTick()}
                className={`inline-flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-parchment/80 transition-colors duration-300 ${hoverOnly}:hover:border-champagne ${hoverOnly}:hover:bg-champagne/10 ${hoverOnly}:hover:text-champagne ${focusRing}`}
              >
                {soc.icon}
                <span>{soc.name}</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ))}
          </div>

          <dl
            className={`mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8 sm:gap-6 ${reveal(inView, 400).className}`}
            style={reveal(inView, 400).style}
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse justify-end">
                <dt className="mt-2 font-mono text-[11px] uppercase leading-snug tracking-[0.14em] text-white/55">
                  {stat.label}
                </dt>
                <dd className="font-display text-3xl font-light text-parchment sm:text-4xl md:text-5xl">
                  <CountUp to={stat.to} suffix={stat.suffix} active={inView} />
                </dd>
              </div>
            ))}
          </dl>

          <div
            className={`mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8 ${reveal(inView, 500).className}`}
            style={reveal(inView, 500).style}
          >
            <button
              type="button"
              onClick={() => {
                sound.playShutter();
                onOpenBooking();
              }}
              className={`group relative inline-flex min-h-14 w-full touch-manipulation items-center justify-center gap-3 overflow-hidden bg-champagne px-8 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-black transition-[transform,background-color] duration-300 active:scale-[0.98] motion-reduce:transition-none sm:w-auto ${hoverOnly}:hover:bg-champagne-light ${focusRing}`}
            >
              Book consultation
              <Arrow />
            </button>

            <a
              href="https://wa.me/2349027880069"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sound.playTick()}
              className={`group relative inline-flex min-h-11 touch-manipulation items-center gap-3 self-start py-2 font-mono text-xs uppercase tracking-[0.2em] text-parchment/75 transition-colors duration-300 motion-reduce:transition-none sm:self-auto ${hoverOnly}:hover:text-champagne ${focusRing}`}
            >
              <span className="relative">
                Direct WhatsApp channel (+234 902 788 0069)
                <span className="sr-only"> (opens in a new tab)</span>
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 -bottom-1 h-px origin-right scale-x-0 bg-champagne transition-transform duration-500 motion-reduce:transition-none ${hoverOnly}:group-hover:origin-left ${hoverOnly}:group-hover:scale-x-100 ${ease}`}
                />
              </span>
              <Arrow />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
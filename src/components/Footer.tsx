"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { sound } from "@/lib/sound";

const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const hoverOnly = "[@media(hover:hover)]";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-champagne";

const PHRASES = [
  "Timeless Art",
  "Dahir Media",
  "Cinematic Heritage",
  "Visual Sovereignty",
];

const MARQUEE_CSS = `
  @keyframes footer-marquee { to { transform: translate3d(-50%, 0, 0); } }
  .footer-marquee-track { animation: footer-marquee 80s linear infinite; }
  @media (hover: hover) {
    .footer-marquee:hover .footer-marquee-track { animation-play-state: paused; }
  }
  @media (prefers-reduced-motion: reduce) {
    .footer-marquee-track { animation: none; }
  }
`;

const FOOTER_LINKS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/dahirmedia/",
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@dahirmedia?si=fD-RtsU6CwBhit74",
  },
  {
    name: "LinkedIn",
    href: "https://ng.linkedin.com/in/aminu-dahiru-lawan-86538427a",
  },
  {
    name: "WhatsApp",
    href: "https://wa.me/2349027880069",
  },
] as const;

const FALLBACK_YEAR = 2026;

function CurrentYear() {
  const [year, setYear] = useState(FALLBACK_YEAR);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return <span>{year}</span>;
}

function MarqueeGroup({ hidden }: { hidden?: boolean }) {
  const items = [...PHRASES, ...PHRASES];
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden ? "true" : undefined}>
      {items.map((phrase, i) => (
        <div key={i} className="flex items-center gap-8 pr-8 md:gap-12 md:pr-12">
          <span className="font-display text-6xl font-light uppercase tracking-tight text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.16)] md:text-8xl lg:text-9xl">
            {phrase}
          </span>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-champagne/50" />
        </div>
      ))}
    </div>
  );
}

function ArrowUpRight() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-500 motion-reduce:transition-none ${hoverOnly}:group-hover:-translate-y-0.5 ${hoverOnly}:group-hover:translate-x-0.5 ${ease}`}
    >
      <path
        d="M4 12 12 4M5.5 4H12v6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => sound.playTick()}
      className={`group relative inline-flex min-h-11 touch-manipulation items-center gap-2 py-2 text-parchment/80 transition-colors duration-300 motion-reduce:transition-none ${hoverOnly}:hover:text-champagne ${focusRing}`}
    >
      <span className="relative">
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 -bottom-1 h-px origin-right scale-x-0 bg-champagne transition-transform duration-500 motion-reduce:transition-none ${hoverOnly}:group-hover:origin-left ${hoverOnly}:group-hover:scale-x-100 ${ease}`}
        />
      </span>
      <ArrowUpRight />
    </a>
  );
}

export default function Footer({ onOpenBooking }: { onOpenBooking: () => void }) {
  const backToTop = () => {
    sound.playTick();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <footer className="relative w-full overflow-hidden border-t border-white/10 bg-black pt-16 text-parchment md:pt-20">
      <style>{MARQUEE_CSS}</style>

      {/* Decorative marquee */}
      <div
        aria-hidden="true"
        className="footer-marquee relative w-full overflow-hidden whitespace-nowrap border-b border-white/10 pb-12 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
      >
        <div className="footer-marquee-track flex w-max will-change-transform">
          <MarqueeGroup />
          <MarqueeGroup hidden />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-[max(3rem,env(safe-area-inset-bottom))] md:px-12">
        <div className="grid grid-cols-1 gap-12 pt-14 md:grid-cols-12 md:items-start md:pt-16">
          
          {/* Brand Column */}
          <div className="md:col-span-5">
            <div className="relative h-12 w-48">
              <Image
                src="/branding/logo.webp"
                alt="Dahir Media"
                fill
                sizes="192px"
                className="object-contain object-left"
              />
            </div>
            <p className="mt-4 max-w-sm font-mono text-[11px] leading-relaxed tracking-wider text-white/55">
              Northern Nigeria and global haute-couture cinematography, royal ceremony archival, and fine documentary art.
            </p>
          </div>

          {/* Social & Booking Links */}
          <nav aria-label="Footer Navigation" className="md:col-span-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-champagne">
              Direct Channels
            </p>
            <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-xs uppercase tracking-[0.2em]">
              {FOOTER_LINKS.map((link) => (
                <li key={link.name}>
                  <ExternalLink href={link.href}>{link.name}</ExternalLink>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    sound.playShutter();
                    onOpenBooking();
                  }}
                  className={`group relative inline-flex min-h-11 touch-manipulation items-center gap-2 py-2 text-champagne transition-colors duration-300 motion-reduce:transition-none ${hoverOnly}:hover:text-champagne-light ${focusRing}`}
                >
                  <span className="relative">
                    Book Concierge
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 -bottom-1 h-px origin-left bg-champagne transition-transform duration-500 motion-reduce:transition-none ${hoverOnly}:group-hover:scale-x-50 ${ease}`}
                    />
                  </span>
                </button>
              </li>
            </ul>
          </nav>

          {/* Technical Specs & HQ */}
          <div className="font-mono text-[11px] uppercase leading-relaxed tracking-widest text-white/55 md:col-span-3 md:text-right">
            <p className="text-parchment">Abuja / Kano / Worldwide</p>
            <p className="mt-1 text-champagne">4K RAW / 60 FPS / 16-BIT COLOR</p>
            <p className="mt-2 text-white/40">VIP Commissions by Appointment</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between md:mt-16">
          <p className="font-mono text-[11px] tracking-wider text-white/55">
            &copy; <CurrentYear /> Dahir Media. All rights reserved.
          </p>

          <button
            type="button"
            onClick={backToTop}
            className={`group inline-flex min-h-11 touch-manipulation items-center gap-2 self-start py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/55 transition-colors duration-300 motion-reduce:transition-none sm:self-auto ${hoverOnly}:hover:text-champagne ${focusRing}`}
          >
            Back to top
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              className={`h-3.5 w-3.5 transition-transform duration-500 motion-reduce:transition-none ${hoverOnly}:group-hover:-translate-y-1 ${ease}`}
            >
              <path
                d="M8 13.5V2.5M3.5 7 8 2.5 12.5 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="square"
              />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
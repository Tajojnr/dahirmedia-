"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { sound } from "@/lib/sound";

interface ShowcaseSlide {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  caption: string;
  image: string;
  specs: {
    lens: string;
    aperture: string;
    iso: string;
    lighting: string;
  };
}

const SHOWCASE_DATA: ShowcaseSlide[] = [
  {
    id: "founder-mastery",
    category: "The Creative Director",
    title: "Aminu Dahiru Lawan",
    subtitle: "Visionary & Lead Cinematographer",
    caption:
      "Directing high-echelon visual chronicles across Nigeria and worldwide destinations, capturing heritage with unmatched fidelity.",
    image: "/showcase/founder-action-2.webp",
    specs: {
      lens: "85mm f/1.2 GM",
      aperture: "f/1.4",
      iso: "ISO 100",
      lighting: "Key Chiaroscuro",
    },
  },
  {
    id: "in-action",
    category: "In The Field",
    title: "Cinematic Precision",
    subtitle: "Real-time Field Direction",
    caption:
      "Capturing raw emotional resonance and royal cultural poise without disrupting the natural sanctity of the moment.",
    image: "/showcase/founder-camera.webp",
    specs: {
      lens: "50mm f/1.2 Cinema",
      aperture: "f/1.8",
      iso: "ISO 200",
      lighting: "Ambient Sunlight",
    },
  },
  {
    id: "sample-youth",
    category: "Cultural Masterpiece",
    title: "The Joy of Kanem",
    subtitle: "Youth & Heritage Series",
    caption:
      "Authentic radiance captured through full-frame large-format sensors, preserving natural skin tones and rich tonal depth.",
    image: "/showcase/sample-2.webp",
    specs: {
      lens: "135mm f/1.8 Prime",
      aperture: "f/2.0",
      iso: "ISO 160",
      lighting: "Soft Octabox",
    },
  },
  {
    id: "sample-modesty",
    category: "Haute Couture",
    title: "Grace & Poise",
    subtitle: "Northern Elegance",
    caption:
      "A tribute to the timeless beauty and dignity of Northern Nigerian traditions, sculpted with precise cinematic keylights.",
    image: "/showcase/sample-3.webp",
    specs: {
      lens: "85mm f/1.4 Art",
      aperture: "f/1.6",
      iso: "ISO 100",
      lighting: "Rembrandt Studio",
    },
  },
  {
    id: "sample-culture",
    category: "Royal Nuptials",
    title: "Sovereign Heritage",
    subtitle: "Ceremonial Archival",
    caption:
      "Monumental wedding documentation honoring lineage, royal ceremonies, and intricate haute-couture fabrics.",
    image: "/showcase/sample-1.webp",
    specs: {
      lens: "35mm f/1.4 Cinema",
      aperture: "f/2.8",
      iso: "ISO 320",
      lighting: "Diffused Rim Light",
    },
  },
  {
    id: "founder-studio",
    category: "Studio Executive",
    title: "Post-Production Lab",
    subtitle: "16-Bit Color Science",
    caption:
      "Every frame undergoes master-grade Davinci Resolve color grading to achieve museum-quality visual grandeur.",
    image: "/showcase/founder-headshot.webp",
    specs: {
      lens: "70-200mm f/2.8",
      aperture: "f/2.8",
      iso: "ISO 250",
      lighting: "Dual Edge Strips",
    },
  },
];

const easeSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
};

const easeCubic = [0.22, 1, 0.36, 1] as const;

export default function ShowcaseMorph({
  onOpenBooking,
}: {
  onOpenBooking: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = SHOWCASE_DATA[activeIndex];

  const nextSlide = () => {
    sound.playTick();
    setActiveIndex((prev) => (prev + 1) % SHOWCASE_DATA.length);
  };

  const prevSlide = () => {
    sound.playTick();
    setActiveIndex(
      (prev) => (prev - 1 + SHOWCASE_DATA.length) % SHOWCASE_DATA.length
    );
  };

  const selectSlide = (index: number) => {
    if (index === activeIndex) return;
    sound.playTick();
    setActiveIndex(index);
  };

  return (
    <section
      aria-label="Visual chronicle showcase"
      className="relative w-full overflow-hidden border-t border-white/10 bg-obsidian py-24 md:py-32"
    >
      {/* Background Radial Aura for transparent subject cutout */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-champagne/10 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1/4 top-1/3 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-champagne/5 blur-[120px]"
      />

      <div className="mx-auto max-w-7xl px-6 md:px-12">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-champagne">
              <span className="h-px w-8 bg-champagne" />
              Master Archive // Visual Chronicle
            </p>
            <h2 className="mt-3 font-display text-4xl font-light text-parchment sm:text-5xl lg:text-6xl">
              Portraits of <span className="italic text-champagne">Distinction.</span>
            </h2>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs tracking-widest text-white/50">
              0{activeIndex + 1} / 0{SHOWCASE_DATA.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous showcase slide"
                className="flex h-11 w-11 items-center justify-center border border-white/20 bg-white/5 text-parchment transition-colors hover:border-champagne hover:bg-champagne/10 hover:text-champagne active:scale-95"
              >
                &larr;
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next showcase slide"
                className="flex h-11 w-11 items-center justify-center border border-white/20 bg-white/5 text-parchment transition-colors hover:border-champagne hover:bg-champagne/10 hover:text-champagne active:scale-95"
              >
                &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Main Morph Stage Grid */}
        <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Morphing Large Cutout Canvas */}
          <div className="relative flex aspect-[4/5] w-full items-end justify-center overflow-hidden border border-champagne/25 bg-gradient-to-b from-white/[0.04] to-transparent p-4 sm:p-8 lg:col-span-6">
            
            {/* Viewfinder Reticles */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-4 border border-white/10"
            >
              <span className="absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-champagne" />
              <span className="absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-champagne" />
              <span className="absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-champagne" />
              <span className="absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-champagne" />
              
              {/* Center Crosshair */}
              <span className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-champagne/40" />
              <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-champagne/40" />
            </div>

            {/* Live Metadata Tag */}
            <div className="absolute left-7 top-7 z-10 font-mono text-[10px] uppercase tracking-[0.2em] text-champagne/80">
              FRAME // {activeSlide.id.toUpperCase()}
            </div>

            {/* Morphing Image Component */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide.id}
                initial={{ opacity: 0, scale: 0.94, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -20 }}
                transition={easeSpring}
                className="relative z-10 flex h-[90%] w-full items-end justify-center"
              >
                <div className="relative h-full w-full">
                  <Image
                    src={activeSlide.image}
                    alt={activeSlide.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 550px"
                    className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)]"
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Stage Pedestal */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-obsidian via-obsidian/70 to-transparent"
            />
          </div>

          {/* Morphing Content & Technical Specs */}
          <div className="flex flex-col justify-center lg:col-span-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.45, ease: easeCubic }}
              >
                <div className="inline-block border border-champagne/40 bg-champagne/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-champagne">
                  {activeSlide.category}
                </div>

                <h3 className="mt-5 font-display text-4xl font-light text-parchment sm:text-5xl">
                  {activeSlide.title}
                </h3>
                
                <p className="mt-2 font-mono text-sm uppercase tracking-wider text-champagne/90">
                  {activeSlide.subtitle}
                </p>

                <p className="mt-5 max-w-lg font-sans text-base font-light leading-relaxed text-parchment/75 md:text-lg">
                  {activeSlide.caption}
                </p>

                {/* Technical Shot Specifications */}
                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
                    Optics & Studio Calibration
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="border border-white/10 bg-white/[0.02] p-3">
                      <dt className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                        Optic
                      </dt>
                      <dd className="mt-1 font-mono text-xs text-parchment">
                        {activeSlide.specs.lens}
                      </dd>
                    </div>

                    <div className="border border-white/10 bg-white/[0.02] p-3">
                      <dt className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                        Aperture
                      </dt>
                      <dd className="mt-1 font-mono text-xs text-champagne">
                        {activeSlide.specs.aperture}
                      </dd>
                    </div>

                    <div className="border border-white/10 bg-white/[0.02] p-3">
                      <dt className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                        Exposure
                      </dt>
                      <dd className="mt-1 font-mono text-xs text-parchment">
                        {activeSlide.specs.iso}
                      </dd>
                    </div>

                    <div className="border border-white/10 bg-white/[0.02] p-3">
                      <dt className="font-mono text-[9px] uppercase tracking-wider text-white/45">
                        Lighting
                      </dt>
                      <dd className="mt-1 font-mono text-xs text-parchment">
                        {activeSlide.specs.lighting}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playShutter();
                      onOpenBooking();
                    }}
                    className="bg-champagne px-7 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-black transition-transform duration-300 hover:brightness-110 active:scale-95"
                  >
                    Commission Direction
                  </button>
                  <a
                    href="https://wa.me/2349027880069"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => sound.playTick()}
                    className="border border-white/20 px-6 py-3.5 font-mono text-xs uppercase tracking-[0.2em] text-parchment/80 transition-colors hover:border-champagne hover:text-champagne"
                  >
                    WhatsApp Brief (+234 902 788 0069)
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Morph Thumbnails Strip */}
        <div className="mt-16 border-t border-white/10 pt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
            Interactive Subject Selector
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
            {SHOWCASE_DATA.map((slide, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => selectSlide(idx)}
                  className={`group relative flex aspect-square w-full flex-col items-center justify-end overflow-hidden border p-2 transition-all duration-300 ${
                    isCurrent
                      ? "border-champagne bg-champagne/15"
                      : "border-white/15 bg-white/5 hover:border-white/40"
                  }`}
                >
                  <div className="relative h-4/5 w-full">
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      sizes="120px"
                      className={`object-contain object-bottom transition-transform duration-500 group-hover:scale-105 ${
                        isCurrent ? "brightness-110" : "opacity-60 grayscale"
                      }`}
                    />
                  </div>
                  <span className="relative z-10 mt-1 truncate font-mono text-[9px] uppercase tracking-wider text-parchment">
                    0{idx + 1} {slide.category.split(" ")[0]}
                  </span>
                  {isCurrent && (
                    <motion.div
                      layoutId="activeThumbBar"
                      className="absolute inset-x-0 bottom-0 h-0.5 bg-champagne"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
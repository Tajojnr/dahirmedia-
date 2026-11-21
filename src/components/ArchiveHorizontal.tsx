"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sound } from "@/lib/sound";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Project {
  id: string;
  category: string;
  title: string;
  location: string;
  year: string;
  videoSrc: string;
  exif: string;
}

const PROJECTS: Project[] = [
  {
    id: "01",
    category: "ROYAL NUPTIALS",
    title: "The Kano Heritage Wedding",
    location: "Kano, Nigeria",
    year: "2025",
    videoSrc: "/videos/wedding.mp4",
    exif: "85mm • f/1.4 • 1/250s",
  },
  {
    id: "02",
    category: "SOUL & FORM",
    title: "Portraits of Aristocracy",
    location: "Abuja, Nigeria",
    year: "2025",
    videoSrc: "/videos/portrait.mp4",
    exif: "50mm • f/1.2 • ISO 64",
  },
  {
    id: "03",
    category: "HAUTE COUTURE",
    title: "Avant-Garde Desert Veil",
    location: "Sahara Dunes",
    year: "2024",
    videoSrc: "/videos/fashion.mp4",
    exif: "35mm • f/2.0 • 1/1000s",
  },
  {
    id: "04",
    category: "CINEMA & STREET",
    title: "The Golden Twilight Procession",
    location: "Northern Province",
    year: "2024",
    videoSrc: "/videos/cinema.mp4",
    exif: "24mm • f/2.8 • 4K RAW",
  },
];

export default function ArchiveHorizontal({
  onOpenBooking,
}: {
  onOpenBooking: () => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  /* ──────────────────────────────────────────────
     HORIZONTAL SCROLL
     ────────────────────────────────────────────── */
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const getDistance = () =>
        Math.max(track.scrollWidth - window.innerWidth, 0);

      const setProgress = progressRef.current
        ? gsap.quickSetter(progressRef.current, "scaleX")
        : null;

      const scroll = gsap.to(track, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // Extended track distance gives each card generous screen presence
          end: () => `+=${Math.max(getDistance() * 1.6, window.innerHeight * 3)}`,
          pin: true,
          pinSpacing: true,
          scrub: 1.2,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setProgress?.(self.progress),
        },
      });

      gsap.utils.toArray<HTMLElement>("[data-card]", track).forEach((card) => {
        const layer = card.querySelector("[data-parallax]");
        if (!layer) return;
        gsap.fromTo(
          layer,
          { xPercent: -10 },
          {
            xPercent: 10,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              containerAnimation: scroll,
              start: "left right",
              end: "right left",
              scrub: true,
            },
          }
        );
      });
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      section.style.overflowX = "auto";
      return () => {
        section.style.overflowX = "";
      };
    });

    return () => mm.revert();
  }, []);

  /* ──────────────────────────────────────────────
     VIDEOS
     - A video is revealed as soon as it has a frame to show. This is checked
       directly (readyState) as well as by events, so a video that loaded
       before React attached its handlers can never stay invisible.
     - Only videos near the screen play; the rest pause.
     - Load failures are logged with the exact path.
     ────────────────────────────────────────────── */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const videos = Array.from(track.querySelectorAll("video"));
    const cleanups: Array<() => void> = [];

    videos.forEach((video) => {
      const reveal = () => {
        video.dataset.ready = "true";
      };
      const fail = () => {
        console.warn(
          `[ArchiveHorizontal] Video failed to load: ${video.getAttribute("src")}. ` +
            `Check that the file exists in /public/videos and the name matches.`
        );
      };

      if (video.readyState >= 2) reveal();
      video.addEventListener("loadeddata", reveal);
      video.addEventListener("canplay", reveal);
      video.addEventListener("error", fail);

      // Reduced motion: still show a frame, but never autoplay
      if (reduced) {
        video.preload = "auto";
        video.load();
      }

      cleanups.push(() => {
        video.removeEventListener("loadeddata", reveal);
        video.removeEventListener("canplay", reveal);
        video.removeEventListener("error", fail);
      });
    });

    let io: IntersectionObserver | undefined;
    if (!reduced) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const video = entry.target as HTMLVideoElement;
            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        },
        // Start a little before a card slides into view
        { threshold: 0.1, rootMargin: "0px 25% 0px 25%" }
      );
      videos.forEach((v) => io!.observe(v));
    }

    return () => {
      io?.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <section
      id="archives"
      ref={sectionRef}
      aria-label="Selected archives: curated works and master reels"
      className="relative overflow-hidden bg-obsidian"
    >
      <div
        ref={trackRef}
        className="relative flex h-screen w-max items-center gap-12 pl-12 pr-12 will-change-transform md:gap-20 md:pl-24 md:pr-24"
      >
        {/* Intro Card */}
        <div className="flex w-[80vw] shrink-0 flex-col justify-center md:w-[35vw]">
          <span className="font-mono text-xs uppercase tracking-widest text-champagne">
            SELECTED ARCHIVES // 2024 - 2025
          </span>
          <h2 className="mt-4 font-display text-5xl font-light leading-[1.0] text-parchment md:text-7xl">
            Curated Works <br />
            <span className="font-normal italic text-champagne">
              & Master Reels.
            </span>
          </h2>
          <p className="mt-6 max-w-md font-sans text-sm font-light leading-relaxed text-parchment/60">
            Every frame is composed with an uncompromising devotion to light,
            cultural stature, and cinematic permanence.
          </p>
          <div
            className="mt-8 flex items-center gap-2 font-mono text-[11px] text-white/40"
            aria-hidden="true"
          >
            <span>SCROLL TO EXPLORE</span>
            <span>&rarr;</span>
          </div>
        </div>

        {/* Project Cards */}
        {PROJECTS.map((proj) => (
          <article
            key={proj.id}
            data-card
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") sound.playTick();
            }}
            className="group relative flex h-[72vh] w-[75vw] shrink-0 flex-col justify-between overflow-hidden border border-white/10 bg-obsidian-card p-6 sm:w-[50vw] md:w-[38vw]"
          >
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div
                data-parallax
                className="absolute inset-y-0 left-[-15%] w-[130%] will-change-transform"
              >
                <video
                  src={proj.videoSrc}
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-hidden="true"
                  tabIndex={-1}
                  className="h-full w-full scale-100 object-cover opacity-0 transition-[opacity,transform] duration-700 ease-out data-[ready=true]:opacity-80 data-[ready=true]:group-hover:opacity-95 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60" />
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 border border-champagne/60 opacity-0 shadow-[inset_0_0_40px_rgba(212,175,55,0.12)] transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100"
            />

            <div className="relative z-10 flex items-start justify-between font-mono text-[10px] uppercase tracking-widest text-white/60">
              <span className="font-bold text-champagne">
                {proj.id} / {proj.category}
              </span>
              <span>{proj.year}</span>
            </div>

            <div className="relative z-10">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-champagne">
                {proj.location} • {proj.exif}
              </div>
              <h3 className="font-display text-3xl font-light text-parchment md:text-4xl">
                {proj.title}
              </h3>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <button
                  type="button"
                  aria-label={`Inquire about a commission like ${proj.title}`}
                  onClick={() => {
                    sound.playShutter();
                    onOpenBooking();
                  }}
                  className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-parchment transition-colors group-hover:text-champagne"
                >
                  <span>INQUIRE COMMISSION</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div
        ref={progressRef}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-30 h-px origin-left scale-x-0 bg-champagne"
      />
    </section>
  );
}
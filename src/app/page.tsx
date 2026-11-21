"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Preloader from "@/components/Preloader";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ApparatusCanvas from "@/components/ApparatusCanvas";
import ServicesSection from "@/components/ServicesSection";
import ArchiveHorizontal from "@/components/ArchiveHorizontal";
import MasterScrubCinema from "@/components/MasterScrubCinema";
import ShowcaseMorph from "@/components/ShowcaseMorph";
import CuratorSection from "@/components/CuratorSection";
import Footer from "@/components/Footer";
import BookingConcierge from "@/components/BookingConcierge";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // Stops pins from re-measuring every time the mobile address bar collapses
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/* Scroll position survives refreshes within the same browser tab session */
const SCROLL_KEY = "dahir:scroll";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  const openBooking = useCallback(() => setIsBookingOpen(true), []);
  const closeBooking = useCallback(() => setIsBookingOpen(false), []);

  /* ──────────────────────────────────────────────
     SMOOTH SCROLL + SCROLL MEMORY
     Lenis is driven by GSAP's own ticker, so scrolling and every
     ScrollTrigger share a single animation loop.
     ────────────────────────────────────────────── */
  useEffect(() => {
    // We restore the position ourselves, after the pins have been measured
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    let saved = 0;
    try {
      saved = Number(sessionStorage.getItem(SCROLL_KEY)) || 0;
    } catch {
      /* storage unavailable: behave like a first visit */
    }
    const returning = saved > 80;

    // Refreshing mid-page: skip the preloader and go straight back
    if (returning) setIsLoading(false);

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;

    // Reduced motion: native scrolling, no smoothing
    if (!reduceMotion) {
      lenis = new Lenis({
        duration: 1.4,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 0.8,
      });
      lenisRef.current = lenis;

      lenis.on("scroll", ScrollTrigger.update);

      tick = (time: number) => lenis!.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const jump = (y: number) => {
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    };

    // Track whether the visitor has touched the page, so a late re-measure
    // never yanks them back after they have started scrolling
    let interacted = false;
    const markInteracted = () => {
      interacted = true;
    };
    const interactionEvents = ["wheel", "touchstart", "keydown"] as const;
    interactionEvents.forEach((evt) =>
      window.addEventListener(evt, markInteracted, { passive: true, once: true })
    );

    // Save the position (throttled to one write per frame)
    let restored = !returning;
    let ticking = false;
    const save = () => {
      // Until restored and touched, keep the stored value rather than a clamped one
      if (returning && !interacted) return;
      try {
        sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.scrollY)));
      } catch {
        /* ignore */
      }
    };
    const onScroll = () => {
      if (!restored || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        save();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", save);

    // Restore, or start at the top on a first visit
    let restoreFrame = 0;
    if (returning) {
      restoreFrame = requestAnimationFrame(() => {
        jump(saved);
        restored = true;
      });
    } else {
      window.scrollTo(0, 0);
    }

    // Fonts and images change section heights, so measure again once they land
    let cancelled = false;
    const refresh = () => {
      if (cancelled) return;
      ScrollTrigger.refresh();
      if (returning && !interacted) jump(saved);
    };
    document.fonts?.ready.then(refresh);
    if (document.readyState !== "complete") {
      window.addEventListener("load", refresh, { once: true });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(restoreFrame);
      window.removeEventListener("load", refresh);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", save);
      interactionEvents.forEach((evt) =>
        window.removeEventListener(evt, markInteracted)
      );
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, []);

  /* ──────────────────────────────────────────────
     SCROLL LOCK
     Frozen behind the preloader and the booking modal. Uses Lenis when it
     is running, and plain overflow when it is not.
     ────────────────────────────────────────────── */
  const locked = isLoading || isBookingOpen;

  useEffect(() => {
    const lenis = lenisRef.current;
    if (lenis) {
      if (locked) lenis.stop();
      else lenis.start();
      return;
    }
    document.documentElement.style.overflow = locked ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [locked]);

  /* Re-measure every pin once the preloader has left and the layout is final */
  const handlePreloaderComplete = useCallback(() => {
    setIsLoading(false);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, []);

  return (
    <>
      {/* Viewfinder HUD Preloader */}
      {isLoading && <Preloader onComplete={handlePreloaderComplete} />}

      {/* Navigation Bar */}
      <Navbar onOpenBooking={openBooking} />

      {/* Master Experience Flow.
          Deliberately a plain block (no flex). ScrollTrigger wraps each pinned
          section in a spacer, and inside a flex column that spacer can shrink,
          ending the pin early. */}
      <main
        id="main"
        tabIndex={-1}
        className="relative min-h-screen w-full bg-obsidian text-parchment outline-none"
      >
        {/* 01: Hero Viewfinder */}
        <Hero onOpenBooking={openBooking} />

        {/* 02: Camera Apparatus Canvas Scrub */}
        <ApparatusCanvas />

        {/* 03: Four Core Services */}
        <ServicesSection />

        {/* 04: Pinned Horizontal Archive Gallery */}
        <ArchiveHorizontal onOpenBooking={openBooking} />

        {/* 05: Master Cinema Canvas Scrub */}
        <MasterScrubCinema />

        {/* 06: Morph Cutout Stage (Founder & Master Works) */}
        <ShowcaseMorph onOpenBooking={openBooking} />

        {/* 07: Curator & Founder Section */}
        <CuratorSection onOpenBooking={openBooking} />
      </main>

      {/* Global Footer */}
      <Footer onOpenBooking={openBooking} />

      {/* VIP Booking Concierge Modal */}
      <BookingConcierge isOpen={isBookingOpen} onClose={closeBooking} />
    </>
  );
}
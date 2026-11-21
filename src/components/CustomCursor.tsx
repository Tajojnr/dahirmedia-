"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "default" | "hover" | "text";

const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]";

// Things that should light the reticle up
const INTERACTIVE = [
  "a[href]",
  "button",
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  "summary",
  "label[for]",
  "select",
  "[data-magnetic]",
  '[data-cursor="hover"]',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  'input[type="range"]',
  'input[type="file"]',
].join(",");

// Places where the native I-beam is the right cursor, so the reticle steps aside
const TEXT_FIELD =
  'textarea,[contenteditable="true"],input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="color"]):not([type="image"])';

const DISABLED = ':disabled,[aria-disabled="true"]';

const HIDE_NATIVE_CURSOR = `
  html, html * { cursor: none !important; }
  html :is(${TEXT_FIELD}) { cursor: text !important; }
`;

const pad = (n: number) => String(Math.max(0, Math.round(n))).padStart(4, "0");

/**
 * Viewfinder cursor. Position is written straight to the DOM from a small rAF loop,
 * so moving the mouse never re-renders React. React state only changes on the rare
 * events: entering or leaving an interactive element, pressing, entering or leaving
 * the window.
 *
 * Optional per-element hooks:
 *   data-cursor-label="View"   replaces the coordinate readout while hovering that element
 *   data-cursor="hover"        makes any element count as interactive
 */
export default function CustomCursor({ hideNativeCursor = true }: { hideNativeCursor?: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>("default");
  const [pressed, setPressed] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);

  // Only for a real mouse or trackpad. Hover-capable and fine-pointer, so phones and
  // most tablets never mount any of this.
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const target = { x: -100, y: -100 };
    const cur = { x: -100, y: -100 };
    let label: string | null = null;
    let raf = 0;
    let last = 0;
    let seen = false;

    const render = () => {
      root.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
      if (readoutRef.current) {
        readoutRef.current.textContent = label ?? `X:${pad(target.x)} Y:${pad(target.y)}`;
      }
    };

    // Frame-rate independent smoothing. The loop sleeps once the reticle has settled.
    const frame = (t: number) => {
      const dt = Math.min(t - last, 48);
      last = t;
      const k = reduceMotion.matches ? 1 : 1 - Math.exp(-dt / 42);
      cur.x += (target.x - cur.x) * k;
      cur.y += (target.y - cur.y) * k;

      if (Math.abs(target.x - cur.x) < 0.05 && Math.abs(target.y - cur.y) < 0.05) {
        cur.x = target.x;
        cur.y = target.y;
        raf = 0;
      } else {
        raf = requestAnimationFrame(frame);
      }
      render();
    };

    const kick = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target.x = e.clientX;
      target.y = e.clientY;
      if (!seen) {
        // First move: appear where the pointer is, never fly in from the corner
        seen = true;
        cur.x = target.x;
        cur.y = target.y;
        setVisible(true);
      }
      kick();
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = e.target instanceof Element ? e.target : null;

      let next: Mode = "default";
      if (el) {
        if (el.closest(TEXT_FIELD)) {
          next = "text";
        } else {
          const hit = el.closest(INTERACTIVE);
          if (hit && !hit.closest(DISABLED)) next = "hover";
        }
      }

      label =
        next === "hover"
          ? el?.closest("[data-cursor-label]")?.getAttribute("data-cursor-label")?.toUpperCase() ?? null
          : null;

      setMode(next);
      kick();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button === 0) setPressed(true);
    };
    const onUp = () => setPressed(false);
    const onLeave = () => {
      setVisible(false);
      setPressed(false);
    };
    const onEnter = () => {
      if (seen) setVisible(true);
    };

    const html = document.documentElement;
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("blur", onUp);
    html.addEventListener("mouseleave", onLeave);
    html.addEventListener("mouseenter", onEnter);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", onUp);
      html.removeEventListener("mouseleave", onLeave);
      html.removeEventListener("mouseenter", onEnter);
    };
  }, [enabled]);

  if (!enabled) return null;

  const active = mode === "hover" || pressed;
  const size = pressed ? "h-9 w-9" : mode === "hover" ? "h-16 w-16" : "h-12 w-12";

  return (
    <>
      {hideNativeCursor && <style>{HIDE_NATIVE_CURSOR}</style>}

      <div
        ref={rootRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[999] will-change-transform"
        style={{ transform: "translate3d(-100px, -100px, 0)" }}
      >
        {/* The reticle is centred on the pointer. It changes size rather than scaling,
            so the hairline brackets stay hairline. */}
        <div
          className={`absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_1px_rgba(0,0,0,0.7)] transition-[width,height,opacity,color] duration-300 motion-reduce:transition-none ${ease} ${size} ${
            visible && mode !== "text" ? "opacity-100" : "opacity-0"
          } ${active ? "text-champagne" : "text-white/55"}`}
        >
          <span className="absolute left-0 top-0 h-2.5 w-2.5 border-l border-t border-current" />
          <span className="absolute right-0 top-0 h-2.5 w-2.5 border-r border-t border-current" />
          <span className="absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-current" />
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-current" />

          <span
            className={`absolute inset-0 m-auto h-1 w-1 rounded-full transition-[transform,background-color] duration-300 motion-reduce:transition-none ${ease} ${
              active ? "scale-150 bg-filmRed" : "bg-white/70"
            }`}
          />

          {/* EXIF-style readout. Updated by the loop, not by React. */}
          <span
            ref={readoutRef}
            className={`absolute left-full top-full ml-1 mt-1 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest tabular-nums transition-colors duration-300 motion-reduce:transition-none ${
              mode === "hover" ? "text-champagne/80" : "text-white/45"
            }`}
          >
            X:0000 Y:0000
          </span>
        </div>
      </div>
    </>
  );
}
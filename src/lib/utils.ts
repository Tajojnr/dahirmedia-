import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/* ───────────── classes ───────────── */

/** Merge conditional class names, resolving Tailwind conflicts (last wins). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ───────────── motion ───────────── */

/** Shared easing curves, as framer-motion tuples. Same ones used by the Preloader. */
export const EASE_OPTICAL = [0.22, 1, 0.36, 1] as const; // fast start, long settle
export const EASE_CINEMATIC = [0.76, 0, 0.24, 1] as const; // slow in, slow out

/** Build an easing function (t: 0..1 → 0..1) from a CSS-style cubic bezier. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
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

export const easeOptical = cubicBezier(...EASE_OPTICAL);
export const easeCinematic = cubicBezier(...EASE_CINEMATIC);

/* ───────────── math ───────────── */

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Map a value from one range to another (optionally clamped). */
export function mapRange(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clampOutput = true
) {
  if (inMin === inMax) return outMin;
  const t = (v - inMin) / (inMax - inMin);
  const out = lerp(outMin, outMax, t);
  if (!clampOutput) return out;
  return outMin < outMax ? clamp(out, outMin, outMax) : clamp(out, outMax, outMin);
}

/* ───────────── formatting ───────────── */

/** 7 → "007". Handy for HUD counters, frame numbers, indexes. */
export const pad = (n: number, length = 2) => String(Math.round(n)).padStart(length, "0");

/** "Kano / Abuja" → "kano-abuja" */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/** Build an absolute URL from a path using NEXT_PUBLIC_SITE_URL (falls back to localhost). */
export function absoluteUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/* ───────────── environment ───────────── */

export const isBrowser = typeof window !== "undefined";

export function prefersReducedMotion() {
  return isBrowser && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function hasFinePointer() {
  return isBrowser && window.matchMedia("(pointer: fine)").matches;
}

/* ───────────── async ───────────── */

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Trailing-edge debounce. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait = 150) {
  let id: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: A) => {
    if (id) clearTimeout(id);
    id = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => id && clearTimeout(id);
  return debounced;
}
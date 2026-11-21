"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Check } from "lucide-react";
import { sound } from "@/lib/sound";

/* ------------------------------------------------------------------ config */

const WHATSAPP_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2349027880069"
).replace(/\D/g, "");

/* Founder portrait. Change the path if the file sits in a /public subfolder. */
const FOUNDER_IMAGE = "/founder-sideview.webp";
const FOUNDER_NAME = "Aminu Dahiru Lawan";
const FOUNDER_TITLE = "Founder";
const FOUNDER_FIRST_NAME = FOUNDER_NAME.split(" ")[0];

const EXPERIENCES = [
  "Film & Photography",
  "Weddings & Royal Events",
  "Documentary Cinema",
  "Social & Communications",
];

const LOCATIONS = [
  { value: "Abuja", label: "Abuja, Nigeria" },
  { value: "Kano", label: "Kano, Nigeria" },
  { value: "Lagos", label: "Lagos, Nigeria" },
  { value: "International", label: "International Destination" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

const INITIAL_FORM = {
  eventType: EXPERIENCES[0],
  location: "Abuja",
  date: "",
  name: "",
  phone: "",
  notes: "",
};

type Step = 1 | 2 | 3;

/* What the founder says at each step. Edit these freely. */
const GREETINGS: Record<Step, string> = {
  1: `Welcome. I’m ${FOUNDER_FIRST_NAME}, and I’d be honoured to tell your story. Start by telling me what you have in mind.`,
  2: "Wonderful. Tell me where we’ll be and when, so we can be ready for you.",
  3: "Almost there. Send me your details and I’ll reply to you personally on WhatsApp.",
};

const FIELD =
  "w-full border bg-obsidian-surface p-3 font-mono text-base text-parchment outline-none transition-colors focus:border-champagne sm:text-xs";
const LABEL =
  "mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/50";
const BTN_GHOST =
  "border border-white/20 px-6 py-3 font-mono text-xs uppercase tracking-widest text-parchment transition-colors hover:border-champagne hover:text-champagne";
const BTN_GOLD =
  "bg-champagne px-6 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-black transition-[filter] hover:brightness-110";

/* ------------------------------------------------------- founder greeting */

/* Keyed by step, so it remounts and "types" again on every step change */
function FounderGreeting({
  text,
  reduce,
}: {
  text: string;
  reduce: boolean | null;
}) {
  const [typing, setTyping] = useState(!reduce);

  useEffect(() => {
    if (!typing) return;
    const t = window.setTimeout(() => setTyping(false), 700);
    return () => window.clearTimeout(t);
  }, [typing]);

  return (
    <div className="border border-champagne/30 bg-obsidian/85 p-4 md:p-5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
        <span className="text-champagne">{FOUNDER_NAME}</span>
        <span className="text-white/40">// {FOUNDER_TITLE}</span>
      </div>

      <div className="mt-3 min-h-[4.5rem] md:min-h-[7rem]" aria-live="polite">
        {typing ? (
          <div className="flex items-center gap-1.5 pt-2" aria-label="Typing">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-champagne"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </div>
        ) : (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="font-display text-lg font-light italic leading-snug text-parchment md:text-xl"
          >
            {text}
          </motion.p>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- component */

export default function BookingConcierge({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const uid = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [attempted, setAttempted] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [today, setToday] = useState("");

  /* Fetch the portrait while the page is idle, so it is ready when the modal opens */
  useEffect(() => {
    const load = () => {
      const img = new window.Image();
      img.decoding = "async";
      img.src = FOUNDER_IMAGE;
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(load, { timeout: 4000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(load, 2000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => {
      const d = new Date();
      setToday(
        new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 10)
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  const update = (patch: Partial<typeof INITIAL_FORM>) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const nameOk = formData.name.trim().length >= 2;
  const phoneOk = formData.phone.replace(/\D/g, "").length >= 7;

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  /* Return focus to opener */
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    return () => opener?.focus?.();
  }, [isOpen]);

  /* Reset form after exit animation */
  useEffect(() => {
    if (isOpen) return;
    const t = window.setTimeout(() => {
      setStep(1);
      setDirection(1);
      setAttempted(false);
      setFormData(INITIAL_FORM);
    }, 500);
    return () => window.clearTimeout(t);
  }, [isOpen]);

  /* Focus trap inside dialog */
  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const items = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const goTo = (next: Step) => {
    sound.playTick();
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const handleSelectType = (type: string) => {
    sound.playTick();
    update({ eventType: type });
  };

  const handleDispatch = () => {
    setAttempted(true);
    if (!nameOk || !phoneOk) return;

    sound.playShutter();
    const message = encodeURIComponent(
      `*VIP INQUIRY | DAHIR MEDIA*\n\n` +
        `*Client:* ${formData.name.trim()}\n` +
        `*Service Scope:* ${formData.eventType}\n` +
        `*Location:* ${formData.location}\n` +
        `*Target Date:* ${formData.date || "To be confirmed"}\n` +
        `*Phone:* ${formData.phone.trim()}\n` +
        `*Creative Brief:* ${formData.notes.trim() || "None provided"}`
    );
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`,
      "_blank",
      "noopener,noreferrer"
    );
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) goTo(2);
    else if (step === 2) goTo(3);
    else handleDispatch();
  };

  const focusHeading = (definition: unknown) => {
    if (definition !== "center") return;
    dialogRef.current
      ?.querySelector<HTMLElement>("[data-step-heading]")
      ?.focus({ preventScroll: true });
  };

  const x = reduce ? 0 : 24;
  const stepVariants = {
    enter: (d: number) => ({ opacity: 0, x: d * x }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -x }),
  };

  const headingClass =
    "font-display text-3xl font-light text-parchment outline-none";

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onKeyDown={trapFocus}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Commission concierge"
            data-lenis-prevent
            initial={{ opacity: 0, scale: reduce ? 1 : 0.96, y: reduce ? 0 : 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.96, y: reduce ? 0 : 24 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="relative z-10 max-h-[92svh] w-full max-w-4xl overflow-y-auto overscroll-contain border border-champagne/40 bg-obsidian shadow-[0_0_80px_rgba(212,175,55,0.15)] md:grid md:grid-cols-[minmax(0,1fr)_300px]"
          >
            {/* ── Founder panel: banner on mobile, side portrait on desktop ── */}
            <aside className="relative flex flex-col border-b border-white/10 bg-obsidian-surface md:order-2 md:justify-end md:border-b-0 md:border-l">
              <div className="relative h-44 overflow-hidden md:absolute md:inset-0 md:h-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={FOUNDER_IMAGE}
                  alt={`Portrait of ${FOUNDER_NAME}, ${FOUNDER_TITLE}`}
                  decoding="async"
                  draggable={false}
                  ref={(el) => {
                    if (el?.complete && el.naturalWidth > 0) {
                      el.dataset.loaded = "true";
                    }
                  }}
                  onLoad={(e) => {
                    e.currentTarget.dataset.loaded = "true";
                  }}
                  onError={() =>
                    console.warn(
                      `[BookingConcierge] Founder image failed to load: ${FOUNDER_IMAGE}. ` +
                        `Check the file exists in /public and the path matches.`
                    )
                  }
                  className="h-full w-full scale-105 object-cover object-[50%_6%] opacity-0 transition-[opacity,transform] duration-1000 ease-out data-[loaded=true]:scale-100 data-[loaded=true]:opacity-100 md:object-[85%_0%]"
                />
                {/* Blends the portrait into the panel and lifts the message card */}
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-surface via-obsidian-surface/25 to-transparent" />
              </div>

              <div className="relative z-10 p-4 md:p-6">
                <FounderGreeting
                  key={step}
                  text={GREETINGS[step]}
                  reduce={reduce}
                />
              </div>
            </aside>

            {/* ── Form panel ── */}
            <div className="p-6 md:min-h-[600px] md:p-10">
              {/* Header & Step Tracker */}
              <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div
                  className="font-mono text-xs uppercase tracking-widest text-champagne"
                  aria-live="polite"
                >
                  VIP CONCIERGE // STEP 0{step} OF 03
                </div>
                <button
                  type="button"
                  aria-label="Close concierge"
                  onClick={() => {
                    sound.playTick();
                    onClose();
                  }}
                  className="p-1 text-white/60 transition-colors hover:text-champagne"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 flex gap-1.5" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-px flex-1 bg-white/10">
                    <div
                      className="h-full origin-left bg-champagne transition-transform duration-700"
                      style={{
                        transform: `scaleX(${step >= n ? 1 : 0})`,
                        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  </div>
                ))}
              </div>

              <form noValidate onSubmit={handleSubmit}>
                <AnimatePresence mode="wait" custom={direction} initial={false}>
                  {/* Step 1: Service Scope Selection */}
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3, ease: EASE }}
                      onAnimationComplete={focusHeading}
                      className="py-8"
                    >
                      <h2 tabIndex={-1} data-step-heading className={headingClass}>
                        Select Service Scope
                      </h2>
                      <div
                        role="radiogroup"
                        aria-label="Service scope selection"
                        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
                      >
                        {EXPERIENCES.map((item) => {
                          const selected = formData.eventType === item;
                          return (
                            <button
                              key={item}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => handleSelectType(item)}
                              className={`border p-4 text-left font-mono text-xs uppercase tracking-wider transition-colors ${
                                selected
                                  ? "border-champagne bg-champagne/10 text-champagne"
                                  : "border-white/10 text-parchment/60 hover:border-white/30"
                              }`}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-8 flex justify-end">
                        <button type="submit" className={BTN_GOLD}>
                          Proceed to Location &rarr;
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Location & Timeline */}
                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3, ease: EASE }}
                      onAnimationComplete={focusHeading}
                      className="space-y-4 py-8"
                    >
                      <h2 tabIndex={-1} data-step-heading className={headingClass}>
                        Location & Timeline
                      </h2>

                      <div>
                        <label htmlFor={`${uid}-location`} className={LABEL}>
                          Primary Destination
                        </label>
                        <select
                          id={`${uid}-location`}
                          value={formData.location}
                          onChange={(e) => update({ location: e.target.value })}
                          className={`${FIELD} border-white/20`}
                        >
                          {LOCATIONS.map((l) => (
                            <option key={l.value} value={l.value}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor={`${uid}-date`} className={LABEL}>
                          Ceremony or Production Date
                        </label>
                        <input
                          id={`${uid}-date`}
                          type="date"
                          min={today || undefined}
                          value={formData.date}
                          onChange={(e) => update({ date: e.target.value })}
                          className={`${FIELD} border-white/20 [color-scheme:dark]`}
                        />
                      </div>

                      <div className="mt-8 flex justify-between">
                        <button
                          type="button"
                          onClick={() => goTo(1)}
                          className={BTN_GHOST}
                        >
                          &larr; Back
                        </button>
                        <button type="submit" className={BTN_GOLD}>
                          Final Step &rarr;
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Contact & Direct Dispatch */}
                  {step === 3 && (
                    <motion.div
                      key="step-3"
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.3, ease: EASE }}
                      onAnimationComplete={focusHeading}
                      className="space-y-4 py-8"
                    >
                      <h2 tabIndex={-1} data-step-heading className={headingClass}>
                        Client VIP Verification
                      </h2>

                      <div>
                        <label htmlFor={`${uid}-name`} className={LABEL}>
                          Full Name / Title
                        </label>
                        <input
                          id={`${uid}-name`}
                          type="text"
                          autoComplete="name"
                          placeholder="Your full name"
                          value={formData.name}
                          onChange={(e) => update({ name: e.target.value })}
                          aria-invalid={attempted && !nameOk}
                          aria-describedby={
                            attempted && !nameOk ? `${uid}-name-err` : undefined
                          }
                          className={`${FIELD} ${
                            attempted && !nameOk ? "border-crimson" : "border-white/20"
                          }`}
                        />
                        {attempted && !nameOk && (
                          <p
                            id={`${uid}-name-err`}
                            role="alert"
                            className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-crimson"
                          >
                            Please enter your name
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor={`${uid}-phone`} className={LABEL}>
                          WhatsApp / Direct Phone
                        </label>
                        <input
                          id={`${uid}-phone`}
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="+234..."
                          value={formData.phone}
                          onChange={(e) => update({ phone: e.target.value })}
                          aria-invalid={attempted && !phoneOk}
                          aria-describedby={
                            attempted && !phoneOk ? `${uid}-phone-err` : undefined
                          }
                          className={`${FIELD} ${
                            attempted && !phoneOk ? "border-crimson" : "border-white/20"
                          }`}
                        />
                        {attempted && !phoneOk && (
                          <p
                            id={`${uid}-phone-err`}
                            role="alert"
                            className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-crimson"
                          >
                            Please enter a valid phone number
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor={`${uid}-notes`} className={LABEL}>
                          Creative Scope & Brief
                        </label>
                        <textarea
                          id={`${uid}-notes`}
                          rows={3}
                          placeholder="Describe event scale, guest count, or vision..."
                          value={formData.notes}
                          onChange={(e) => update({ notes: e.target.value })}
                          className={`${FIELD} resize-none border-white/20`}
                        />
                      </div>

                      <div className="mt-8 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => goTo(2)}
                          className={BTN_GHOST}
                        >
                          &larr; Back
                        </button>
                        <button
                          type="submit"
                          className="flex items-center gap-2 bg-champagne px-8 py-3 font-mono text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-[filter] hover:brightness-110"
                        >
                          <span>Dispatch to WhatsApp</span>
                          <Check size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
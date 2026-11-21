import { Camera, Clapperboard, Megaphone, MessagesSquare } from "lucide-react";

const SERVICES = [
  {
    number: "01",
    title: "Film & Photography",
    description:
      "Thoughtful visual production for people, brands, and moments worth remembering.",
    Icon: Camera,
  },
  {
    number: "02",
    title: "Weddings & Events",
    description:
      "Cinematic coverage of celebrations, ceremonies, and the details between them.",
    Icon: Clapperboard,
  },
  {
    number: "03",
    title: "Documentaries",
    description:
      "Human stories captured with care, context, and a strong sense of place.",
    Icon: MessagesSquare,
  },
  {
    number: "04",
    title: "Social & Communications",
    description:
      "Social media management and visual storytelling that give brands a clear voice.",
    Icon: Megaphone,
  },
] as const;

export default function ServicesSection() {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="relative border-y border-white/10 bg-obsidian-surface py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="max-w-3xl">
          <p className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.2em] text-champagne">
            <span aria-hidden="true" className="h-px w-10 bg-champagne" />
            Services // What we do
          </p>
          <h2
            id="services-heading"
            className="mt-5 font-display text-4xl font-light leading-[1.1] text-balance text-parchment sm:text-5xl lg:text-6xl"
          >
            Stories made to <span className="italic text-champagne">move.</span>
          </h2>
          <p className="mt-5 max-w-2xl font-sans text-base font-light leading-relaxed text-parchment/65 md:text-lg">
            From the first conversation to the final frame, Dahir Media brings
            film, photography, and communication together under one creative
            vision.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 border-l border-t border-white/10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {SERVICES.map(({ number, title, description, Icon }) => (
            <article
              key={number}
              className="group min-h-64 border-b border-r border-white/10 p-6 transition-colors duration-500 hover:bg-white/[0.025] sm:p-8"
            >
              <div className="flex items-center justify-between">
                <Icon
                  aria-hidden="true"
                  className="h-6 w-6 text-champagne transition-transform duration-500 group-hover:-translate-y-1"
                  strokeWidth={1.4}
                />
                <span className="font-mono text-[10px] tracking-[0.2em] text-white/35">
                  {number} //
                </span>
              </div>
              <h3 className="mt-12 font-display text-2xl font-light text-parchment sm:text-3xl">
                {title}
              </h3>
              <p className="mt-3 font-sans text-sm font-light leading-relaxed text-white/55">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

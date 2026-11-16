import Link from "next/link";
import { createElement } from "react";
import { ArrowRight, Baby, Briefcase, Cake, Gem, Heart, PartyPopper, Sparkles, Users, type LucideIcon } from "lucide-react";
import { AppImage } from "@/components/ui";
import type { Occasion } from "@/lib/occasions";

const icons: Record<string, LucideIcon> = {
  wedding: PartyPopper,
  birthday: Cake,
  anniversary: Heart,
  engagement: Gem,
  "baby-shower": Baby,
  corporate: Briefcase,
  festival: Sparkles,
  "kitty-party": Users,
};

/** The icon for an occasion. */
export function OccasionIcon({ slug, className }: { slug: string; className?: string }) {
  return createElement(icons[slug] ?? PartyPopper, { className, "aria-hidden": true });
}

/** Colourful tile that links to one occasion page. */
export function OccasionCard({ occasion }: { occasion: Occasion }) {
  const href = occasion.slug === "wedding" ? "/wedding" : `/events/${occasion.slug}`;
  return (
    <Link
      href={href}
      className={`group relative flex min-h-72 flex-col justify-end overflow-hidden rounded-[2rem] bg-gradient-to-br ${occasion.gradient} p-6 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl`}
    >
      <div className="absolute -right-8 -top-8 size-36 opacity-90 transition duration-500 group-hover:rotate-6 group-hover:scale-110">
        <AppImage src={occasion.image} alt="" sizes="160px" className="rounded-full object-cover" />
      </div>
      <span className="absolute left-5 top-5 flex size-12 items-center justify-center rounded-full bg-white/25 backdrop-blur">
        <OccasionIcon slug={occasion.slug} className="size-6" />
      </span>
      <div className="relative">
        <h3 className="font-display text-2xl font-bold uppercase leading-tight tracking-wide drop-shadow">{occasion.title}</h3>
        <p className="mt-1 text-sm text-white/90">{occasion.tagline}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider">
          {occasion.guests} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

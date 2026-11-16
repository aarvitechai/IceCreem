import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Users } from "lucide-react";
import { SpinStamp } from "@/components/home/spin-stamp";
import { OccasionCard, OccasionIcon } from "@/components/occasions/occasion-card";
import { ShareButtons } from "@/components/share/share-buttons";
import { AppImage } from "@/components/ui";
import { brand, whatsappLink } from "@/lib/brand";
import { occasionBySlug, occasions } from "@/lib/occasions";

type Props = { params: Promise<{ slug: string }> };

// Weddings have their own page with packages, so they are not built here.
const pages = occasions.filter((o) => o.slug !== "wedding");

export function generateStaticParams() {
  return pages.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const o = occasionBySlug((await params).slug);
  if (!o) return { title: "Event not found" };
  return {
    title: `${o.title} ice cream counter`,
    description: `${o.description} ${o.guests}. Call ${brand.phoneDisplay}.`,
    alternates: { canonical: `/events/${o.slug}` },
  };
}

const included = ["Trained serving staff", "Decorated counter", "Cups, cones and spoons", "Set up and clean up"];

export default async function OccasionPage({ params }: Props) {
  const o = occasionBySlug((await params).slug);
  if (!o || o.slug === "wedding") notFound();
  const others = pages.filter((x) => x.slug !== o.slug).slice(0, 4);
  const book = `/wedding/book?event=${o.eventType}`;

  return (
    <div className="space-y-16 pb-4 sm:space-y-20">
      <section className={`relative overflow-hidden bg-gradient-to-br ${o.gradient} text-white`}>
        <span aria-hidden className="absolute -left-16 -top-16 size-64 rounded-full bg-white/10" />
        <div className="container-page relative grid items-center gap-8 py-12 md:grid-cols-[1.2fr_1fr] md:py-16">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <OccasionIcon slug={o.slug} className="size-3.5" /> {o.short}
            </span>
            <h1 className="font-display text-5xl font-bold uppercase leading-[1.02] tracking-wide sm:text-6xl">{o.title}</h1>
            <p className="text-xl font-medium">{o.tagline}</p>
            <p className="max-w-xl text-white/90">{o.description}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={book} className="btn bg-white px-6 py-3 text-berry-dark hover:bg-cream">Check dates and book</Link>
              <a href={whatsappLink(`Hi, I want an ice cream counter for a ${o.short.toLowerCase()}.`)} target="_blank" rel="noreferrer" className="btn border border-white/60 px-6 py-3 text-white hover:bg-white/10">
                Ask on WhatsApp
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold"><Users className="size-4" /> {o.guests}</div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] shadow-2xl ring-8 ring-white/20">
              <AppImage src={o.image} alt="" priority className="object-cover" />
            </div>
            <SpinStamp className="absolute -bottom-6 left-0 sm:-left-6" />
          </div>
        </div>
      </section>

      <section className="container-page grid gap-6 md:grid-cols-2">
        <div className="surface p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">Ideas for your {o.short.toLowerCase()}</h2>
          <span className="wave mt-2 block" aria-hidden />
          <ul className="mt-5 space-y-3">
            {o.ideas.map((idea, i) => (
              <li key={idea} className="flex items-center gap-3 rounded-2xl bg-cream p-4 font-medium">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sun font-display text-lg font-bold text-choco">{i + 1}</span>
                {idea}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-sun p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">Always included</h2>
          <ul className="mt-5 grid gap-3">
            {included.map((t) => (
              <li key={t} className="flex items-center gap-3 rounded-2xl bg-white p-4 font-medium shadow-sm">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-berry text-white"><Check className="size-4" /></span>
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-choco/80">Pure veg menu. Book at least 7 days ahead. Pay 30 percent advance after you accept the quote.</p>
        </div>
      </section>

      <section className="container-page">
        <div className="surface flex flex-col items-center gap-4 p-6 text-center sm:p-8 md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">Ready to plan?</h2>
            <p className="text-sm text-choco-light">Get a free quote within a day. Share this page with family.</p>
          </div>
          <div className="flex flex-col items-center gap-3 md:items-end">
            <Link href={book} className="btn-primary px-6 py-3">Get a free quote</Link>
            <ShareButtons path={`/events/${o.slug}`} title={`${o.title} | ${brand.name}`} text={o.tagline} />
          </div>
        </div>
      </section>

      <section className="container-page">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <h2 className="section-title">Other celebrations</h2>
          <span className="wave" aria-hidden />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {others.map((x) => <OccasionCard key={x.slug} occasion={x} />)}
        </div>
      </section>
    </div>
  );
}

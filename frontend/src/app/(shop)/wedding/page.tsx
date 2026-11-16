import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarCheck, Check, ClipboardList, IceCreamCone, PartyPopper, Users, Wallet } from "lucide-react";
import { SpinStamp } from "@/components/home/spin-stamp";
import { OccasionCard } from "@/components/occasions/occasion-card";
import { occasions } from "@/lib/occasions";
import { ShareButtons } from "@/components/share/share-buttons";
import { AppImage } from "@/components/ui";
import { brand, whatsappLink } from "@/lib/brand";
import { money } from "@/lib/format";
import { serverApi } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Weddings and Events",
  description: "Live ice cream counters, kulfi carts and sundae bars for weddings, receptions and parties.",
  alternates: { canonical: "/wedding" },
};

const steps = [
  { icon: CalendarCheck, title: "Pick a date", text: "See live availability. Book at least 7 days before the event." },
  { icon: ClipboardList, title: "Get a quote", text: "Share guests and venue. Our team sends a quote within a day." },
  { icon: Wallet, title: "Pay 30 percent", text: "Accept the quote and pay the advance to lock your date." },
  { icon: IceCreamCone, title: "Enjoy the day", text: "We arrive early, set up and serve. Pay the balance after the event." },
];

const included = ["Trained serving staff in uniform", "Decorated counter or kulfi cart", "Cups, cones, spoons and napkins", "Set up and clean up by our team"];

export default function WeddingPage() {
  return (
    <div className="space-y-16 pb-4 sm:space-y-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-pink via-berry to-[#f4a51c] text-white">
        <span aria-hidden className="absolute -left-16 -top-16 size-64 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-sun/20" />
        <div className="container-page relative grid items-center gap-8 py-12 md:grid-cols-[1.2fr_1fr] md:py-16">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <PartyPopper className="size-3.5" /> Weddings, receptions and parties
            </span>
            <h1 className="font-display text-5xl font-bold uppercase leading-[1.02] tracking-wide sm:text-6xl lg:text-7xl">The sweetest counter at your celebration</h1>
            <p className="max-w-xl text-lg text-white/90">Fresh kulfi carts, live scoop counters and sundae bars, served by our trained team.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/wedding/book" className="btn bg-white px-6 py-3 text-berry-dark hover:bg-cream">Check dates and book</Link>
              <a href={whatsappLink("Hi, I want to know about ice cream counters for my event.")} target="_blank" rel="noreferrer" className="btn border border-white/60 px-6 py-3 text-white hover:bg-white/10">
                Ask on WhatsApp
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold"><Users className="size-4" /> 100 to 2000 guests</div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] shadow-2xl ring-8 ring-white/20">
              <AppImage src="/images/packages/gold.svg" alt="Kulfi cart at a wedding" priority className="object-cover" />
            </div>
            <SpinStamp className="absolute -bottom-6 left-0 sm:-left-6" />
          </div>
        </div>
      </section>

      <section className="container-page">
        <SectionTitle title="Choose your package" />
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-cream-dark" />}>
          <Packages />
        </Suspense>
      </section>

      <section className="bg-sun py-12">
        <div className="container-page grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="section-title">Every package includes</h2>
            <span className="wave mt-2 block" aria-hidden />
            <p className="mt-4 text-choco-light">You enjoy the function. We take care of the dessert from start to finish.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {included.map((t) => (
              <li key={t} className="flex items-center gap-3 rounded-2xl bg-white p-4 font-medium shadow-sm">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-berry text-white"><Check className="size-4" /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page">
        <SectionTitle title="How it works" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="surface group relative flex flex-col items-center gap-3 p-6 pt-10 text-center transition hover:-translate-y-1 hover:shadow-md">
              <span className="absolute -top-5 flex size-10 items-center justify-center rounded-full bg-sun font-display text-lg font-bold text-choco shadow">{i + 1}</span>
              <span className="flex size-14 items-center justify-center rounded-full bg-berry-light text-berry transition group-hover:rotate-12 group-hover:scale-110"><Icon className="size-6" /></span>
              <h3 className="font-display text-xl font-semibold uppercase tracking-wide">{title}</h3>
              <p className="text-sm text-choco-light">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page">
        <SectionTitle title="Not a wedding? We do those too" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {occasions.filter((o) => o.slug !== "wedding").slice(0, 4).map((o) => <OccasionCard key={o.slug} occasion={o} />)}
        </div>
        <div className="mt-6 text-center"><Link href="/events" className="btn-outline">See all occasions</Link></div>
      </section>

      <section className="container-page">
        <div className="surface flex flex-col items-center gap-4 p-6 text-center sm:p-8 md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="font-display text-2xl font-semibold uppercase tracking-wide">Planning with family?</h2>
            <p className="text-sm text-choco-light">Share these packages on WhatsApp or anywhere else.</p>
          </div>
          <ShareButtons path="/wedding" title={`Wedding ice cream counters | ${brand.name}`} text="Live counters and kulfi carts for 100 to 2000 guests" />
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-10 flex flex-col items-center gap-2 text-center">
      <h2 className="section-title">{title}</h2>
      <span className="wave" aria-hidden />
    </div>
  );
}

async function Packages() {
  const packages = (await serverApi.packages()) ?? [];
  return (
    <div className="grid items-stretch gap-6 md:grid-cols-3">
      {packages.map((p, i) => {
        const popular = i === 1;
        return (
          <div
            key={p.id}
            className={`relative flex flex-col overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-xl ${popular ? "ring-4 ring-berry md:-my-3" : "ring-choco/5"}`}
          >
            {popular && <div className="bg-berry py-1.5 text-center text-xs font-bold uppercase tracking-widest text-white">Most popular</div>}
            <div className="relative aspect-[3/2] bg-pink-light">
              <AppImage src={p.imageUrl} alt={p.name} className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-6">
              <h3 className="font-display text-3xl font-bold uppercase tracking-wide">{p.name}</h3>
              <p className="text-sm text-choco-light">{p.description}</p>
              <div className="mt-auto pt-4">
                <span className="text-4xl font-bold">{money(p.pricePerHead)}</span>
                <span className="text-sm text-choco-light"> per guest</span>
                <div className="text-xs font-semibold uppercase tracking-wider text-choco-light">Minimum {p.minGuests} guests</div>
              </div>
              <Link href={`/wedding/book?package=${p.id}`} className={`mt-3 ${popular ? "btn-primary" : "btn-outline"} py-3`}>Choose {p.name}</Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarCheck, ClipboardList, IceCreamCone, Wallet } from "lucide-react";
import { AppImage } from "@/components/ui";
import { money } from "@/lib/format";
import { serverApi } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Weddings and Events",
  description: "Live ice cream counters, kulfi carts and sundae bars for weddings, receptions and parties.",
};

export default function WeddingPage() {
  return (
    <div className="container-page space-y-14 py-8">
      <section className="card overflow-hidden bg-gradient-to-br from-berry to-mango p-8 text-white md:p-14">
        <div className="max-w-2xl space-y-4">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Weddings, receptions and parties</span>
          <h1 className="text-4xl font-bold sm:text-5xl">The sweetest counter at your celebration</h1>
          <p className="text-lg text-white/90">Fresh kulfi carts, live scoop counters and sundae bars, served by our trained team. 100 to 2000 guests.</p>
          <Link href="/wedding/book" className="btn w-fit bg-white text-berry hover:bg-cream">Check dates and book</Link>
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-3xl font-bold">Packages</h2>
        <Suspense fallback={<div className="h-80 animate-pulse rounded-3xl bg-cream-dark" />}>
          <Packages />
        </Suspense>
      </section>

      <section>
        <h2 className="mb-6 text-3xl font-bold">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: CalendarCheck, title: "Pick a date", text: "See live availability. Book at least 7 days before the event." },
            { icon: ClipboardList, title: "Get a quote", text: "Share guests and venue. Our team sends a quote within a day." },
            { icon: Wallet, title: "Pay 30 percent", text: "Accept the quote and pay the advance to lock your date." },
            { icon: IceCreamCone, title: "Enjoy the day", text: "We arrive early, set up and serve. Pay the balance after the event." },
          ].map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="card p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-2xl bg-mango-light p-3 text-mango"><Icon className="size-5" /></span>
                <span className="text-sm font-bold text-choco/30">STEP {i + 1}</span>
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-choco-light">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

async function Packages() {
  const packages = (await serverApi.packages()) ?? [];
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {packages.map((p, i) => (
        <div key={p.id} className={`card flex flex-col overflow-hidden ${i === 1 ? "ring-2 ring-berry" : ""}`}>
          <div className="relative aspect-[3/2] bg-cream-dark">
            <AppImage src={p.imageUrl} alt={p.name} />
            {i === 1 && <span className="absolute right-3 top-3 rounded-full bg-berry px-3 py-1 text-xs font-bold text-white">Most popular</span>}
          </div>
          <div className="flex flex-1 flex-col gap-2 p-6">
            <h3 className="text-2xl font-bold">{p.name}</h3>
            <p className="text-sm text-choco-light">{p.description}</p>
            <div className="mt-auto pt-4">
              <span className="text-3xl font-bold">{money(p.pricePerHead)}</span>
              <span className="text-sm text-choco-light"> per guest</span>
              <div className="text-xs text-choco-light">Minimum {p.minGuests} guests</div>
            </div>
            <Link href={`/wedding/book?package=${p.id}`} className="btn-primary mt-3">Choose {p.name}</Link>
          </div>
        </div>
      ))}
    </div>
  );
}

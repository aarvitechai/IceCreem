import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, MapPin, MessageCircle, Navigation, Phone, PartyPopper, ShoppingBag } from "lucide-react";
import { PageBanner } from "@/components/layout/page-banner";
import { addressText, brand, mapsLink, telLink, whatsappLink } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: `Call or WhatsApp ${brand.name} on ${brand.phoneDisplay} for orders, parties and weddings. Visit us at ${addressText}.`,
};

export default function ContactPage() {
  return (
    <>
    <PageBanner title="Talk to us" text="Orders, bulk packs, parties and weddings. We reply fast on WhatsApp." />
    <div className="container-page max-w-4xl space-y-6 py-10">

      <div className="grid gap-4 md:grid-cols-2">
        <a href={telLink} className="group flex items-center gap-4 rounded-[2rem] bg-berry p-6 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <span className="flex size-14 items-center justify-center rounded-full bg-white text-berry transition group-hover:rotate-12"><Phone className="size-6" /></span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-white/80">Call {brand.owner}</span>
            <span className="block font-display text-2xl font-bold">{brand.phoneDisplay}</span>
          </span>
        </a>
        <a href={whatsappLink()} target="_blank" rel="noreferrer" className="group flex items-center gap-4 rounded-[2rem] bg-[#25d366] p-6 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
          <span className="flex size-14 items-center justify-center rounded-full bg-white text-[#1da851] transition group-hover:rotate-12"><MessageCircle className="size-6" /></span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wider text-white/80">WhatsApp</span>
            <span className="block font-display text-2xl font-bold uppercase tracking-wide">Chat to order</span>
          </span>
        </a>
      </div>

      <section className="surface grid overflow-hidden md:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
          <span className="flex size-14 items-center justify-center rounded-full bg-sun text-choco"><MapPin className="size-7" /></span>
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Visit us</h2>
            <address className="mt-1 text-lg not-italic">{addressText}<br /><span className="text-choco-light">{brand.address.region}</span></address>
          </div>
          <a href={mapsLink} target="_blank" rel="noreferrer" className="btn-primary w-fit"><Navigation className="size-4" /> Get directions</a>
        </div>
        {/* A drawn map that opens Google Maps. Embedded maps need an API key and can be blocked. */}
        <a
          href={mapsLink}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${addressText} in Google Maps`}
          className="group relative flex min-h-64 items-center justify-center overflow-hidden bg-[#eaf4e8] md:min-h-80"
        >
          <svg aria-hidden viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
            <rect width="400" height="300" fill="#eaf4e8" />
            <path d="M-20 210 C 80 180, 160 240, 260 190 S 420 150, 440 170" stroke="#a7d3f0" strokeWidth="26" fill="none" />
            <g stroke="#ffffff" strokeWidth="10" fill="none" strokeLinecap="round">
              <path d="M0 80 L400 120" /><path d="M120 0 L160 300" /><path d="M260 0 L240 300" /><path d="M0 250 L400 230" />
            </g>
            <g stroke="#fbcd0a" strokeWidth="6" fill="none" strokeLinecap="round"><path d="M0 150 L400 140" /></g>
            <g fill="#d7ead3"><rect x="20" y="10" width="80" height="55" rx="8" /><rect x="180" y="20" width="60" height="45" rx="8" /><rect x="290" y="30" width="90" height="70" rx="8" /><rect x="30" y="100" width="70" height="35" rx="8" /><rect x="300" y="255" width="80" height="40" rx="8" /></g>
          </svg>
          <span className="relative flex flex-col items-center gap-3">
            <span className="flex size-16 animate-bounce items-center justify-center rounded-full bg-berry text-white shadow-lg ring-8 ring-white/70"><MapPin className="size-8" /></span>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow transition group-hover:bg-choco group-hover:text-white">Open in Google Maps</span>
          </span>
        </a>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { href: "/products", icon: ShoppingBag, text: "Order online with home delivery" },
          { href: "/events", icon: PartyPopper, text: "Weddings, birthdays and other events" },
          { href: "/partner", icon: Handshake, text: "Franchise and bulk enquiries" },
        ].map(({ href, icon: Icon, text }) => (
          <Link key={href} href={href} className="surface group flex items-center gap-3 p-5 font-medium transition hover:-translate-y-0.5 hover:text-berry hover:shadow-md">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sun text-choco"><Icon className="size-5" /></span>
            {text}
          </Link>
        ))}
      </div>
    </div>
    </>
  );
}

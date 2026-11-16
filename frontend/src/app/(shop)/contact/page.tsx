import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, MessageCircle, Phone, PartyPopper, ShoppingBag } from "lucide-react";
import { PageBanner } from "@/components/layout/page-banner";
import { brand, telLink, whatsappLink } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: `Call or WhatsApp ${brand.name} on ${brand.phoneDisplay} for orders, parties and weddings.`,
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

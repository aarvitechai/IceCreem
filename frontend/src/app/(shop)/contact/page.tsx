import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Phone, PartyPopper, ShoppingBag } from "lucide-react";
import { brand, telLink, whatsappLink } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: `Call or WhatsApp ${brand.name} on ${brand.phoneDisplay} for orders, parties and weddings.`,
};

export default function ContactPage() {
  return (
    <div className="container-page max-w-4xl space-y-8 py-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Talk to us</h1>
        <p className="text-lg text-choco-light">Orders, bulk packs, parties and weddings. We reply fast on WhatsApp.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <a href={telLink} className="card flex items-center gap-4 p-6 transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="rounded-2xl bg-berry-light p-4 text-berry"><Phone className="size-6" /></span>
          <span>
            <span className="block text-sm text-choco-light">Call {brand.owner}</span>
            <span className="block font-display text-2xl font-bold">{brand.phoneDisplay}</span>
          </span>
        </a>
        <a href={whatsappLink()} target="_blank" rel="noreferrer" className="card flex items-center gap-4 p-6 transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="rounded-2xl bg-mint-light p-4 text-mint"><MessageCircle className="size-6" /></span>
          <span>
            <span className="block text-sm text-choco-light">WhatsApp</span>
            <span className="block font-display text-2xl font-bold">Chat to order</span>
          </span>
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/products" className="card flex items-center gap-3 p-5 hover:text-berry">
          <ShoppingBag className="size-5 text-berry" /> Order online with home delivery
        </Link>
        <Link href="/wedding/book" className="card flex items-center gap-3 p-5 hover:text-berry">
          <PartyPopper className="size-5 text-berry" /> Check dates for a wedding or party
        </Link>
      </div>
    </div>
  );
}

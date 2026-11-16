import Link from "next/link";
import { brand, telLink, whatsappLink } from "@/lib/brand";
import { BrandLogo } from "./brand-logo";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-choco text-cream">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <BrandLogo light />
          <p className="text-sm text-cream/70">{brand.tagline}. Tubs, cones, kulfi and family packs made fresh every morning.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Shop</h4>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><Link href="/products?category=tubs" className="hover:text-white">Tubs and Cups</Link></li>
            <li><Link href="/products?category=cones" className="hover:text-white">Cones</Link></li>
            <li><Link href="/products?category=kulfi" className="hover:text-white">Kulfi</Link></li>
            <li><Link href="/products?category=family" className="hover:text-white">Family Packs</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Help</h4>
          <ul className="space-y-2 text-sm text-cream/70">
            <li><Link href="/track" className="hover:text-white">Track your order</Link></li>
            <li><Link href="/wedding" className="hover:text-white">Wedding and party booking</Link></li>
            <li><Link href="/about" className="hover:text-white">About and FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Order by phone</h4>
          <ul className="space-y-2 text-sm text-cream/70">
            <li>{brand.owner}</li>
            <li><a href={telLink} className="font-semibold text-white hover:underline">{brand.phoneDisplay}</a></li>
            <li><a href={whatsappLink()} target="_blank" rel="noreferrer" className="hover:text-white">Chat on WhatsApp</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/50">
        © {brand.name}. Prices include GST. Free delivery above Rs 499.
      </div>
    </footer>
  );
}

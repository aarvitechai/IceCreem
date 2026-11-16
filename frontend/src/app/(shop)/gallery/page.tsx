import type { Metadata } from "next";
import { Camera } from "lucide-react";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { PageBanner } from "@/components/layout/page-banner";
import { brand, whatsappLink } from "@/lib/brand";
import { gallery } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description: `Ice creams, kulfi, event counters and offers from ${brand.name}.`,
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <PageBanner title="Gallery" text="Scoops, kulfi carts and sweet moments. Tap a picture to see it big." />
      <div className="container-page space-y-12 py-10">
        <GalleryGrid items={gallery} />

        <section className="flex flex-col items-center gap-4 rounded-[2rem] bg-sun p-8 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-4">
            <span className="hidden size-14 shrink-0 items-center justify-center rounded-full bg-white text-berry sm:flex"><Camera className="size-7" /></span>
            <div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Clicked a sweet moment with us?</h2>
              <p className="text-sm text-choco/80">Send your photo on WhatsApp and we may feature it here.</p>
            </div>
          </div>
          <a href={whatsappLink("Hi, sharing a photo from our event with your ice cream.")} target="_blank" rel="noreferrer" className="btn shrink-0 bg-[#25d366] text-white hover:brightness-95">
            Share on WhatsApp
          </a>
        </section>
      </div>
    </>
  );
}

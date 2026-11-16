import Link from "next/link";
import { Suspense } from "react";
import { Leaf, PartyPopper, Snowflake, Truck } from "lucide-react";
import { HeroCarousel, ProductSlider } from "@/components/product/hero-carousel";
import { ProductCard, ProductGridSkeleton } from "@/components/product/product-card";
import { AppImage } from "@/components/ui";
import { brand, telLink, whatsappLink } from "@/lib/brand";
import { serverApi } from "@/lib/server-api";

export default function HomePage() {
  return (
    <div className="container-page space-y-16 pt-6">
      <Suspense fallback={<div className="h-[340px] animate-pulse rounded-3xl bg-cream-dark sm:h-[460px]" />}>
        <Hero />
      </Suspense>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Snowflake, title: "Made fresh daily", text: "Churned every morning" },
          { icon: Leaf, title: "Real ingredients", text: "Farm milk and fruit" },
          { icon: Truck, title: "Cold chain delivery", text: "Free above Rs 499" },
          { icon: PartyPopper, title: "Wedding catering", text: "100 to 2000 guests" },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="card flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center">
            <span className="rounded-2xl bg-berry-light p-3 text-berry"><Icon className="size-5" /></span>
            <div>
              <div className="text-sm font-semibold">{title}</div>
              <div className="text-xs text-choco-light">{text}</div>
            </div>
          </div>
        ))}
      </section>

      <section>
        <SectionTitle title="Shop by category" link="/products" />
        <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-cream-dark" />}>
          <Categories />
        </Suspense>
      </section>

      <section>
        <SectionTitle title="Customer favourites" link="/products" />
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <Featured />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <Offers />
      </Suspense>

      <section className="card grid items-center gap-8 overflow-hidden bg-gradient-to-br from-mint to-emerald-700 p-8 text-white md:grid-cols-2 md:p-12">
        <div className="space-y-4">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Weddings and Events</span>
          <h2 className="text-3xl font-bold sm:text-4xl">Live ice cream counters for your big day</h2>
          <p className="text-white/85">Kulfi carts, sundae bars and themed counters with trained staff. Check date availability and get a quote in minutes.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/wedding/book" className="btn bg-white text-emerald-800 hover:bg-cream">Check availability</Link>
            <Link href="/wedding" className="btn border border-white/50 text-white hover:bg-white/10">See packages</Link>
          </div>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-xs">
          <AppImage src="/images/packages/gold.svg" alt="Kulfi cart" className="rounded-3xl object-cover" />
        </div>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold sm:text-3xl">Order in three easy steps</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            { title: "Pick your flavours", text: "Browse tubs, cones, kulfi and family packs. Prices include GST." },
            { title: "Pay on delivery", text: "Cash or UPI at your door. Free delivery above Rs 499." },
            { title: "Track it live", text: "Watch your order move from our freezer to your door, with a delivery OTP." },
          ].map((s, i) => (
            <li key={s.title} className="card flex gap-4 p-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-berry-light font-display text-lg font-bold text-berry">{i + 1}</span>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-choco-light">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-choco p-6 text-cream sm:p-8">
          <div>
            <h3 className="text-xl font-bold">Prefer to order by phone?</h3>
            <p className="text-sm text-cream/75">Call or WhatsApp {brand.owner} on {brand.phoneDisplay}.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={telLink} className="btn bg-white text-choco hover:bg-cream">Call now</a>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className="btn bg-[#25d366] text-white hover:brightness-95">WhatsApp</a>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ title, link }: { title: string; link: string }) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      <Link href={link} className="text-sm font-semibold text-berry hover:underline">View all</Link>
    </div>
  );
}

async function Hero() {
  const banners = (await serverApi.banners())?.filter((b) => b.position === "Hero") ?? [];
  return banners.length > 0 ? <HeroCarousel banners={banners} /> : null;
}

async function Categories() {
  const categories = (await serverApi.categories()) ?? [];
  return (
    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
      {categories.map((c) => (
        <Link key={c.id} href={`/products?category=${c.slug}`} className="card group w-40 shrink-0 snap-start overflow-hidden text-center transition hover:-translate-y-1 sm:w-auto">
          <div className="relative aspect-square bg-cream-dark">
            <AppImage src={c.imageUrl} alt={c.name} className="object-cover transition group-hover:scale-105" />
          </div>
          <div className="p-3 font-semibold group-hover:text-berry">{c.name}</div>
        </Link>
      ))}
    </div>
  );
}

async function Featured() {
  const products = (await serverApi.featured()) ?? [];
  return (
    <ProductSlider>
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </ProductSlider>
  );
}

async function Offers() {
  const offers = (await serverApi.banners())?.filter((b) => b.position === "Offer") ?? [];
  if (offers.length === 0) return null;
  return (
    <section className="grid gap-4 md:grid-cols-2">
      {offers.map((o) => (
        <Link key={o.id} href={o.linkUrl ?? "/products"} className="relative h-44 overflow-hidden rounded-3xl">
          <AppImage src={o.imageUrl} alt="" sizes="50vw" />
          <div className="relative flex h-full flex-col justify-center gap-1 p-8 text-white">
            <h3 className="text-2xl font-bold">{o.title}</h3>
            {o.subtitle && <p className="text-white/85">{o.subtitle}</p>}
          </div>
        </Link>
      ))}
    </section>
  );
}

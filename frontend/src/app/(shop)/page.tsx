import Link from "next/link";
import { Suspense } from "react";
import { Leaf, PartyPopper, Snowflake, Truck } from "lucide-react";
import { HeroCarousel, ProductSlider } from "@/components/product/hero-carousel";
import { ProductCard, ProductGridSkeleton } from "@/components/product/product-card";
import { AppImage } from "@/components/ui";
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
          <div key={title} className="card flex items-center gap-3 p-4">
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
        <h2 className="mb-6 text-2xl font-bold">What our customers say</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: "Ananya, Lucknow", text: "The mango tub tastes like real Alphonso. Delivery was cold and on time." },
            { name: "Rohit and Neha", text: "Kulfi counter was the star of our wedding. 600 guests and zero stress." },
            { name: "Mr. Verma", text: "We order the family pack every Sunday. Kids love the kesar pista." },
          ].map((t) => (
            <figure key={t.name} className="card p-6">
              <div className="mb-2 text-mango" aria-label="5 stars">★★★★★</div>
              <blockquote className="text-sm text-choco-light">&ldquo;{t.text}&rdquo;</blockquote>
              <figcaption className="mt-3 text-sm font-semibold">{t.name}</figcaption>
            </figure>
          ))}
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((c) => (
        <Link key={c.id} href={`/products?category=${c.slug}`} className="card group overflow-hidden text-center transition hover:-translate-y-1">
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

import Link from "next/link";
import { Suspense } from "react";
import { Clock, Handshake, Leaf, PartyPopper, Snowflake, Sparkles, Truck } from "lucide-react";
import { ExperiencePanels } from "@/components/home/experience-panels";
import { FlavourMarquee } from "@/components/home/flavour-marquee";
import { SpinStamp } from "@/components/home/spin-stamp";
import { HeroCarousel } from "@/components/product/hero-carousel";
import { ProductCard, ProductGridSkeleton } from "@/components/product/product-card";
import { AppImage } from "@/components/ui";
import { brand, telLink, whatsappLink } from "@/lib/brand";
import { PostCard } from "@/components/blog/post-card";
import { HomeReviews } from "@/components/reviews/home-reviews";
import { posts } from "@/lib/blog";
import { occasions } from "@/lib/occasions";
import { serverApi } from "@/lib/server-api";

// Soft colours behind the round category pictures, one per tile in turn.
const tileColours = ["bg-pink-light", "bg-[#fff3c4]", "bg-[#e3f4ee]", "bg-berry-light", "bg-[#e8eefc]", "bg-cream-dark"];

const reasons = [
  { icon: Snowflake, title: "Made fresh daily", text: "Churned every morning in our own factory." },
  { icon: Leaf, title: "Real ingredients", text: "Farm milk, real fruit and pure saffron." },
  { icon: Clock, title: "Same day delivery", text: "Order before 7 PM, enjoy it tonight." },
  { icon: Truck, title: "Cold chain", text: "Packed frozen. Free delivery above Rs 499." },
];

const steps = [
  { title: "Pick your flavours", text: "Tubs, cones, kulfi and family packs. Prices include GST." },
  { title: "Pay on delivery", text: "Cash or UPI at your door. Free delivery above Rs 499." },
  { title: "Track it live", text: "Watch your order move from our freezer to your door." },
];

export default function HomePage() {
  return (
    <div className="space-y-16 pb-4 sm:space-y-20">
      <Suspense fallback={<div className="h-[380px] animate-pulse bg-cream-dark sm:h-[460px] lg:h-[540px]" />}>
        <Hero />
      </Suspense>

      <div className="container-page relative -mt-8 sm:-mt-12">
        <SpinStamp className="absolute -top-28 right-6 z-10 hidden md:block lg:-top-32" />
        <FlavourMarquee />
      </div>

      <section className="reveal container-page">
        <SectionTitle title="Choose your treat" />
        <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-cream-dark" />}>
          <Categories />
        </Suspense>
      </section>

      <section className="reveal container-page">
        <SectionTitle title="Our world of ice cream" />
        <ExperiencePanels />
      </section>

      <section className="reveal container-page">
        <SectionTitle title="Best sellers" link="/products" />
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <BestSellers />
        </Suspense>
      </section>

      <Suspense fallback={null}>
        <Offers />
      </Suspense>

      <section className="reveal bg-sun py-12">
        <div className="container-page">
          <SectionTitle title="Why you will love it" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {reasons.map(({ icon: Icon, title, text }) => (
              <div key={title} className="group flex flex-col items-center gap-3 rounded-3xl bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6">
                <span className="flex size-14 items-center justify-center rounded-full bg-berry text-white transition group-hover:rotate-12 group-hover:scale-110">
                  <Icon className="size-6" />
                </span>
                <div className="font-display text-lg font-semibold uppercase tracking-wide">{title}</div>
                <p className="text-sm text-choco-light">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="reveal container-page">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink to-berry p-8 text-white md:grid-cols-2 md:p-12">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              <PartyPopper className="size-3.5" /> Weddings, birthdays and every celebration
            </span>
            <h2 className="font-display text-4xl font-bold uppercase leading-tight sm:text-5xl">Live ice cream counters for your big day</h2>
            <p className="text-white/90">Kulfi carts, sundae bars and themed counters with trained staff. Check date availability and get a quote in minutes.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/wedding/book" className="btn bg-white text-berry-dark hover:bg-cream">Check availability</Link>
              <Link href="/wedding" className="btn border border-white/60 text-white hover:bg-white/10">See packages</Link>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {occasions.filter((o) => o.slug !== "wedding").map((o) => (
                <Link key={o.slug} href={`/events/${o.slug}`} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider hover:bg-white/30">
                  {o.short}
                </Link>
              ))}
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-xs">
            <AppImage src="/images/packages/gold.svg" alt="Kulfi cart" className="rounded-3xl object-cover" />
          </div>
        </div>
      </section>

      <section className="reveal container-page">
        <SectionTitle title="What customers say" />
        <Suspense fallback={<div className="h-40 animate-pulse rounded-3xl bg-cream-dark" />}>
          <HomeReviews />
        </Suspense>
      </section>

      <section className="reveal container-page">
        <SectionTitle title="From our blog" link="/blog" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((p) => <PostCard key={p.slug} post={p} />)}
        </div>
      </section>

      <section className="reveal container-page">
        <SectionTitle title="Order in three easy steps" />
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-choco/5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sun font-display text-2xl font-bold text-choco">{i + 1}</span>
              <div>
                <h3 className="font-display text-lg font-semibold uppercase tracking-wide">{s.title}</h3>
                <p className="mt-1 text-sm text-choco-light">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Link href="/partner" className="group flex items-center gap-4 rounded-3xl bg-sun p-6 transition hover:-translate-y-1 hover:shadow-md sm:p-8">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-berry transition group-hover:rotate-12">
              <Handshake className="size-7" />
            </span>
            <div>
              <h3 className="font-display text-2xl font-bold uppercase tracking-wide">Grow with us</h3>
              <p className="text-sm text-choco-light">Franchise outlets, distributors and bulk supply. Send an enquiry.</p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-choco p-6 text-cream sm:p-8">
          <div>
            <h3 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-wide">
              <Sparkles className="size-5 text-sun" /> Prefer to order by phone?
            </h3>
            <p className="text-sm text-cream/75">Call or WhatsApp {brand.owner} on {brand.phoneDisplay}.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={telLink} className="btn bg-white text-choco hover:bg-cream">Call now</a>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className="btn bg-[#25d366] text-white hover:brightness-95">WhatsApp</a>
          </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ title, link }: { title: string; link?: string }) {
  return (
    <div className="mb-8 flex flex-col items-center gap-2 text-center">
      <h2 className="section-title">{title}</h2>
      <span className="wave" aria-hidden />
      {link && <Link href={link} className="text-sm font-semibold uppercase tracking-wider text-berry hover:underline">View all</Link>}
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
    <div className="-mx-4 flex snap-x scroll-px-4 gap-5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-8 sm:overflow-visible sm:px-0">
      {categories.map((c, i) => (
        <Link key={c.id} href={`/products?category=${c.slug}`} className="group flex w-28 shrink-0 snap-start flex-col items-center gap-3 text-center sm:w-36">
          <span className={`relative size-28 overflow-hidden rounded-full shadow-md ring-4 ring-white transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl sm:size-36 ${tileColours[i % tileColours.length]}`}>
            <AppImage src={c.imageUrl} alt="" className="object-cover transition duration-500 group-hover:rotate-6 group-hover:scale-110" />
          </span>
          <span className="font-display text-base font-semibold uppercase tracking-wide group-hover:text-berry sm:text-lg">{c.name}</span>
        </Link>
      ))}
    </div>
  );
}

async function BestSellers() {
  const products = (await serverApi.featured()) ?? [];
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

async function Offers() {
  const offers = (await serverApi.banners())?.filter((b) => b.position === "Offer") ?? [];
  if (offers.length === 0) return null;
  return (
    <section className="reveal container-page grid gap-4 md:grid-cols-2">
      {offers.map((o) => (
        <Link key={o.id} href={o.linkUrl ?? "/products"} className="group relative h-48 overflow-hidden rounded-3xl transition hover:-translate-y-1 hover:shadow-lg">
          <AppImage src={o.imageUrl} alt="" sizes="50vw" className="object-cover transition duration-700 group-hover:scale-105" />
          <div className="relative flex h-full max-w-[68%] flex-col justify-center gap-1 p-6 text-white sm:p-8">
            <h3 className="font-display text-2xl font-bold uppercase leading-tight tracking-wide drop-shadow sm:text-3xl">{o.title}</h3>
            {o.subtitle && <p className="text-white/90">{o.subtitle}</p>}
          </div>
        </Link>
      ))}
    </section>
  );
}

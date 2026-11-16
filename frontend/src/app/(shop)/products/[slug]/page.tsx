import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Clock, Leaf, Snowflake } from "lucide-react";
import { AddToCart } from "@/components/product/add-to-cart";
import { ProductCard, ProductGridSkeleton } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ShareButtons } from "@/components/share/share-buttons";
import { PageLoader, VegMark } from "@/components/ui";
import { serverApi } from "@/lib/server-api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await serverApi.product(slug).catch(() => null);
  return product
    ? { title: product.name, description: product.shortDescription, alternates: { canonical: `/products/${slug}` } }
    : { title: "Product not found" };
}

export default function ProductPage({ params }: Props) {
  return (
    <div className="container-page py-8">
      <Suspense fallback={<PageLoader />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ProductDetail({ params }: Props) {
  const { slug } = await params;
  const product = await serverApi.product(slug);
  if (!product) notFound();

  return (
    <>
      <nav className="mb-6 text-xs font-semibold uppercase tracking-wider text-choco-light">
        <Link href="/products" className="hover:text-berry">Ice creams</Link>
        <span className="mx-2">/</span>
        <Link href={`/products?category=${product.categorySlug}`} className="hover:text-berry">{product.categoryName}</Link>
        <span className="mx-2">/</span>
        <span className="text-choco">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div className="space-y-6">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-choco-light ring-1 ring-choco/10">
                <VegMark isVeg={product.isVeg} /> {product.isVeg ? "Pure veg" : "Contains egg"}
              </span>
              <span className="rounded-full bg-sun px-3 py-1 text-choco">{product.categoryName}</span>
            </div>
            <h1 className="font-display text-4xl font-bold uppercase leading-tight tracking-wide sm:text-5xl">{product.name}</h1>
            <span className="wave mt-3 block" aria-hidden />
            <p className="mt-3 text-lg text-choco-light">{product.shortDescription}</p>
          </div>

          <AddToCart product={product} />

          <ul className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: Snowflake, label: "Made fresh daily" },
              { icon: Clock, label: "Same day delivery" },
              { icon: Leaf, label: "Real ingredients" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-choco/5">
                <span className="flex size-10 items-center justify-center rounded-full bg-berry-light text-berry"><Icon className="size-5" /></span>
                <span className="text-[11px] font-semibold uppercase tracking-wide sm:text-xs">{label}</span>
              </li>
            ))}
          </ul>

          <ShareButtons
            path={`/products/${product.slug}`}
            title={`${product.name} | Desired Ice Cream`}
            text={product.shortDescription}
          />

          <div className="divide-y divide-choco/5 rounded-3xl bg-white shadow-sm ring-1 ring-choco/5">
            <Info title="About">{product.description}</Info>
            {product.ingredients && <Info title="Ingredients">{product.ingredients}</Info>}
            <Info title="Storage">Keep frozen at minus 18 degrees. Best before 6 months from manufacture.</Info>
            <Info title="Tax">Price includes {product.gstPercent} percent GST.</Info>
          </div>
        </div>
      </div>

      <section className="mt-16">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <h2 className="section-title">You may also like</h2>
          <span className="wave" aria-hidden />
        </div>
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <Related category={product.categorySlug} exclude={product.slug} />
        </Suspense>
      </section>
    </>
  );
}

/** Same category first, topped up with other favourites so the row is never short. */
async function Related({ category, exclude }: { category: string; exclude: string }) {
  const [same, featured] = await Promise.all([
    serverApi.products(`category=${encodeURIComponent(category)}&pageSize=8`),
    serverApi.featured(),
  ]);
  const seen = new Set([exclude]);
  const picks = [...(same?.items ?? []), ...(featured ?? [])].filter((p) => !seen.has(p.slug) && seen.add(p.slug)).slice(0, 4);
  if (picks.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {picks.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <h3 className="mb-1 font-display text-base font-semibold uppercase tracking-wider text-berry">{title}</h3>
      <p className="text-sm text-choco-light">{children}</p>
    </div>
  );
}

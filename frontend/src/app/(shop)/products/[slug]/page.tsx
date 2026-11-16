import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/components/product/add-to-cart";
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
      <nav className="mb-6 text-sm text-choco-light">
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
            <div className="mb-2 flex items-center gap-2 text-sm text-choco-light">
              <VegMark isVeg={product.isVeg} /> {product.isVeg ? "Pure veg" : "Contains egg"}
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">{product.name}</h1>
            <p className="mt-2 text-lg text-choco-light">{product.shortDescription}</p>
          </div>

          <AddToCart product={product} />

          <ShareButtons
            path={`/products/${product.slug}`}
            title={`${product.name} | Desired Ice Cream`}
            text={product.shortDescription}
          />

          <div className="card divide-y divide-choco/5">
            <Info title="About">{product.description}</Info>
            {product.ingredients && <Info title="Ingredients">{product.ingredients}</Info>}
            <Info title="Storage">Keep frozen at minus 18 degrees. Best before 6 months from manufacture.</Info>
            <Info title="Tax">Price includes {product.gstPercent} percent GST.</Info>
          </div>
        </div>
      </div>
    </>
  );
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <p className="text-sm text-choco-light">{children}</p>
    </div>
  );
}

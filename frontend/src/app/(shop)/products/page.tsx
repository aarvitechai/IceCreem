import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductFilters } from "@/components/product/product-filters";
import { ProductCard, ProductGridSkeleton } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui";
import { serverApi } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Ice Creams",
  description: "Tubs, cones, kulfi, bars and family packs. Fresh from our factory.",
};

type Search = Record<string, string | string[] | undefined>;

export default function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <div className="container-page py-8">
      <h1 className="mb-2 text-3xl font-bold">All ice creams</h1>
      <p className="mb-6 text-choco-light">Prices include GST. Free delivery above Rs 499.</p>
      <Suspense fallback={<div className="mb-6 h-12 animate-pulse rounded-2xl bg-cream-dark" />}>
        <Filters />
      </Suspense>
      <Suspense fallback={<ProductGridSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Filters() {
  const categories = (await serverApi.categories()) ?? [];
  return <ProductFilters categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />;
}

const ALLOWED = ["category", "search", "sort", "minPrice", "maxPrice", "isVeg", "page"];

async function Results({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ALLOWED) {
    const value = params[key];
    if (typeof value === "string" && value) query.set(key, value);
  }
  query.set("pageSize", "12");

  const result = await serverApi.products(query.toString());
  if (!result || result.items.length === 0) {
    return <EmptyState title="No ice creams found" text="Try another category or clear the search." action={<Link href="/products" className="btn-primary">Clear filters</Link>} />;
  }

  const pageLink = (page: number) => {
    const q = new URLSearchParams(query);
    q.delete("pageSize");
    q.set("page", String(page));
    return `/products?${q.toString()}`;
  };

  return (
    <>
      <p className="mb-4 text-sm text-choco-light">{result.totalCount} products</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {result.items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      {result.totalPages > 1 && (
        <div className="flex justify-center gap-3 pt-8">
          {result.page > 1 && <Link href={pageLink(result.page - 1)} className="btn-outline">Previous</Link>}
          <span className="self-center text-sm text-choco-light">Page {result.page} of {result.totalPages}</span>
          {result.page < result.totalPages && <Link href={pageLink(result.page + 1)} className="btn-outline">Next</Link>}
        </div>
      )}
    </>
  );
}

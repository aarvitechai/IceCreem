import Link from "next/link";
import { AppImage, VegMark } from "@/components/ui";
import { discountPercent, money } from "@/lib/format";
import type { ProductCard as Product } from "@/lib/types";
import { QuickAdd } from "./quick-add";

export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product.mrp, product.price);
  const href = `/products/${product.slug}`;
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white p-3 shadow-sm ring-1 ring-choco/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={href} className="relative block aspect-square overflow-hidden rounded-2xl bg-pink-light">
        <AppImage src={product.imageUrl} alt={product.name} className="object-cover transition duration-500 group-hover:scale-110" />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {product.isFeatured && <span className="rounded-full bg-sun px-2.5 py-0.5 text-[11px] font-bold uppercase text-choco">Bestseller</span>}
          {off > 0 && <span className="rounded-full bg-berry px-2.5 py-0.5 text-[11px] font-bold uppercase text-white">{off}% off</span>}
        </div>
        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-choco/80 py-1.5 text-center text-xs font-semibold text-white">Out of stock</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 px-1 pt-3">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-choco-light">
          <VegMark isVeg={product.isVeg} /> {product.categoryName}
        </div>
        <Link href={href} className="font-display text-lg font-semibold uppercase leading-tight tracking-wide hover:text-berry">
          {product.name}
        </Link>
        <p className="line-clamp-2 text-xs text-choco-light">{product.shortDescription}</p>
        {product.quickVariantName && <div className="mt-auto pt-2 text-xs text-choco-light">{product.quickVariantName}</div>}
        <div className={`flex items-baseline gap-2 pb-3 ${product.quickVariantName ? "" : "mt-auto pt-2"}`}>
          <span className="text-lg font-bold">{money(product.quickVariantPrice || product.price)}</span>
          {off > 0 && <span className="text-sm text-choco/40 line-through">{money(product.mrp)}</span>}
        </div>
        <QuickAdd product={product} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-3xl bg-white p-3">
          <div className="aspect-square rounded-2xl bg-cream-dark" />
          <div className="space-y-2 p-2">
            <div className="h-3 w-1/3 rounded bg-cream-dark" />
            <div className="h-5 w-2/3 rounded bg-cream-dark" />
            <div className="h-9 w-full rounded-full bg-cream-dark" />
          </div>
        </div>
      ))}
    </div>
  );
}

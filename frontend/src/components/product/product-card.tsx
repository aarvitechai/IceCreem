import Link from "next/link";
import { AppImage, VegMark } from "@/components/ui";
import { discountPercent, money } from "@/lib/format";
import type { ProductCard as Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product.mrp, product.price);
  return (
    <Link href={`/products/${product.slug}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-square bg-cream-dark">
        <AppImage src={product.imageUrl} alt={product.name} className="object-cover transition duration-300 group-hover:scale-105" />
        {off > 0 && <span className="absolute left-3 top-3 rounded-full bg-berry px-2 py-0.5 text-xs font-bold text-white">{off}% off</span>}
        {!product.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-choco/80 py-1.5 text-center text-xs font-semibold text-white">Out of stock</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-center gap-2 text-xs text-choco-light">
          <VegMark isVeg={product.isVeg} /> {product.categoryName}
        </div>
        <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-berry">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-choco-light">{product.shortDescription}</p>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-bold">{money(product.price)}</span>
          {off > 0 && <span className="text-sm text-choco/40 line-through">{money(product.mrp)}</span>}
          <span className="ml-auto text-xs font-semibold text-berry">View</span>
        </div>
      </div>
    </Link>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card animate-pulse overflow-hidden">
          <div className="aspect-square bg-cream-dark" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-cream-dark" />
            <div className="h-5 w-2/3 rounded bg-cream-dark" />
            <div className="h-4 w-1/4 rounded bg-cream-dark" />
          </div>
        </div>
      ))}
    </div>
  );
}

import "server-only";
import { connection } from "next/server";
import type { ApiResponse, Banner, Category, Paged, ProductCard, ProductDetail, WeddingPackage } from "./types";

const API = `${process.env.API_INTERNAL_URL ?? "http://localhost:5080"}/api/v1`;

/**
 * Server side fetch for SEO pages. Runs at request time (the API has its own
 * 60 second output cache), so builds never depend on the API being up.
 * Returns null on 404 and throws on other errors so error.tsx can show a friendly page.
 */
async function get<T>(path: string): Promise<T | null> {
  await connection();
  const res = await fetch(`${API}${path}`, { headers: { Accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  const body = (await res.json()) as ApiResponse<T>;
  return body.data;
}

export const serverApi = {
  banners: () => get<Banner[]>("/banners"),
  categories: () => get<Category[]>("/categories"),
  featured: () => get<ProductCard[]>("/products/featured"),
  products: (query: string) => get<Paged<ProductCard>>(`/products?${query}`),
  product: (slug: string) => get<ProductDetail>(`/products/${encodeURIComponent(slug)}`),
  packages: () => get<WeddingPackage[]>("/wedding-packages"),
};

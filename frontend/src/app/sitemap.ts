import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

// Main pages. Product pages are found through the listing links.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/products", "/wedding", "/wedding/book", "/about", "/contact", "/track"].map((path) => ({
    url: `${brand.siteUrl}${path}`,
    changeFrequency: path === "/products" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}

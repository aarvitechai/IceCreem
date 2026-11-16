import { posts } from "@/lib/blog";
import { occasions } from "@/lib/occasions";
import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

// Main pages. Product pages are found through the listing links.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/products", "/wedding", "/wedding/book", "/events", ...occasions.filter((o) => o.slug !== "wedding").map((o) => `/events/${o.slug}`), "/gallery", "/blog", ...posts.map((p) => `/blog/${p.slug}`), "/partner", "/about", "/contact", "/track"].map((path) => ({
    url: `${brand.siteUrl}${path}`,
    changeFrequency: path === "/products" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}

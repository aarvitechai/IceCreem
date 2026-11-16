import type { MetadataRoute } from "next";
import { brand, noIndex } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  if (noIndex) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/hawker", "/delivery", "/checkout", "/api/"] },
    sitemap: `${brand.siteUrl}/sitemap.xml`,
  };
}

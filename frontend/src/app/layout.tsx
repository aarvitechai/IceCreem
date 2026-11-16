import type { Metadata, Viewport } from "next";
import { Oswald, Poppins } from "next/font/google";
import { Providers } from "@/components/providers";
import { brand, noIndex } from "@/lib/brand";
import "./globals.css";

const heading = Oswald({ subsets: ["latin"], variable: "--font-heading", weight: ["500", "600", "700"] });
const body = Poppins({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600", "700"] });

const description = `${brand.name}: fresh ice cream tubs, cones, kulfi and family packs with home delivery. Live counters and kulfi carts for weddings and parties. Call ${brand.phoneDisplay}.`;

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: { default: `${brand.name} | Fresh Ice Cream Delivered`, template: `%s | ${brand.name}` },
  description,
  applicationName: brand.name,
  keywords: ["ice cream", "kulfi", "ice cream delivery", "wedding ice cream counter", "family pack", brand.name],
  openGraph: { type: "website", siteName: brand.name, title: `${brand.name} | Fresh Ice Cream Delivered`, description, locale: "en_IN" },
  twitter: { card: "summary_large_image", title: brand.name, description },
  alternates: { canonical: "/" },
  robots: noIndex ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = { themeColor: "#e3504f" };

// Tells search engines who we are and how to call us.
const localBusiness = {
  "@context": "https://schema.org",
  "@type": "IceCreamShop",
  name: brand.name,
  url: brand.siteUrl,
  telephone: brand.phoneE164,
  founder: { "@type": "Person", name: brand.owner },
  priceRange: "₹",
  servesCuisine: "Ice cream, Kulfi",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className="min-h-screen">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

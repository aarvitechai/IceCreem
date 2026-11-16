import type { Metadata, Viewport } from "next";
import { Fredoka, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const heading = Fredoka({ subsets: ["latin"], variable: "--font-heading", weight: ["500", "600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: "Scoop Factory | Fresh Ice Cream Delivered", template: "%s | Scoop Factory" },
  description: "Fresh factory made ice cream, kulfi and family packs. Home delivery and wedding catering.",
};

export const viewport: Viewport = { themeColor: "#d63a6e" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

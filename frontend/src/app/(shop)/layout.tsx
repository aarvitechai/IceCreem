import { Suspense } from "react";
import { ContactFab } from "@/components/layout/contact-fab";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Header reads the URL, so it streams in after the static shell. */}
      <Suspense fallback={<div className="h-16 border-b border-choco/10 bg-cream" />}>
        <SiteHeader />
      </Suspense>
      <main>{children}</main>
      <SiteFooter />
      <ContactFab />
    </>
  );
}

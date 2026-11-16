import Link from "next/link";
import { Suspense } from "react";
import { IceCreamCone, PartyPopper, Search } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function NotFound() {
  return (
    <>
      <Suspense fallback={<div className="h-16 border-b border-choco/10 bg-white" />}>
        <SiteHeader />
      </Suspense>
      <main className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-5 py-16 text-center">
        <span className="flex size-24 items-center justify-center rounded-full bg-pink-light text-5xl" aria-hidden>🍦</span>
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">This scoop melted away</h1>
        <p className="max-w-md text-choco-light">The page you are looking for does not exist or has moved. Try one of these instead.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">Back to home</Link>
          <Link href="/products" className="btn-outline"><IceCreamCone className="size-4" /> Shop ice creams</Link>
          <Link href="/events" className="btn-outline"><PartyPopper className="size-4" /> Events</Link>
          <Link href="/track" className="btn-outline"><Search className="size-4" /> Track order</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

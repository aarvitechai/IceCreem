"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle, PackageSearch } from "lucide-react";
import { PageBanner } from "@/components/layout/page-banner";
import { brand, whatsappLink } from "@/lib/brand";

export default function TrackPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const valid = /^ICE-\d{4}-\d{6}$/i.test(orderNumber.trim()) && /^[6-9]\d{9}$/.test(mobile);

  return (
    <>
    <PageBanner title="Track your order" text="See every step live, from our freezer to your door." />
    <div className="container-page flex flex-col items-center gap-4 py-10">
      <form
        className="surface w-full max-w-md space-y-4 p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) router.push(`/track/${orderNumber.trim().toUpperCase()}?mobile=${mobile}`);
        }}
      >
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-sun text-choco"><PackageSearch className="size-8" /></span>
        <h2 className="text-center font-display text-2xl font-semibold uppercase tracking-wide">Find your order</h2>
        <p className="text-center text-sm text-choco-light">Enter the order number from your confirmation and the mobile used to order.</p>
        <div>
          <label htmlFor="orderNumber" className="label">Order number</label>
          <input id="orderNumber" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ICE-2026-000001" className="input rounded-full uppercase" />
        </div>
        <div>
          <label htmlFor="mobile" className="label">Mobile number</label>
          <input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="10 digit mobile" className="input rounded-full" />
        </div>
        <button disabled={!valid} className="btn-primary w-full py-3.5 text-base">Track order</button>
      </form>
      <a href={whatsappLink("Hi, I need help tracking my order.")} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-choco-light hover:text-berry">
        <MessageCircle className="size-4" /> Lost your order number? WhatsApp {brand.phoneDisplay}
      </a>
    </div>
    </>
  );
}

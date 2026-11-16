"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TrackPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const valid = /^ICE-\d{4}-\d{6}$/i.test(orderNumber.trim()) && /^[6-9]\d{9}$/.test(mobile);

  return (
    <div className="container-page flex justify-center py-16">
      <form
        className="card w-full max-w-md space-y-4 p-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) router.push(`/track/${orderNumber.trim().toUpperCase()}?mobile=${mobile}`);
        }}
      >
        <h1 className="text-2xl font-bold">Track your order</h1>
        <p className="text-sm text-choco-light">Enter the order number from your confirmation and the mobile used to order.</p>
        <div>
          <label htmlFor="orderNumber" className="label">Order number</label>
          <input id="orderNumber" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ICE-2026-000001" className="input uppercase" />
        </div>
        <div>
          <label htmlFor="mobile" className="label">Mobile number</label>
          <input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="10 digit mobile" className="input" />
        </div>
        <button disabled={!valid} className="btn-primary w-full py-3">Track order</button>
      </form>
    </div>
  );
}

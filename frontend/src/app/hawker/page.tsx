"use client";

import { Suspense } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { MobileShell } from "@/components/layout/mobile-shell";
import { EmptyState, PageLoader, StatusBadge } from "@/components/ui";
import { useHawkerMeQuery } from "@/features/admin/api";
import { date, money } from "@/lib/format";

export default function HawkerPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RequireAuth roles={["Hawker"]}>
        <MobileShell title="My stock and dues">
          <Content />
        </MobileShell>
      </RequireAuth>
    </Suspense>
  );
}

function Content() {
  const { data, isLoading } = useHawkerMeQuery(undefined, { pollingInterval: 120_000 });
  if (isLoading) return <PageLoader />;
  if (!data) return <EmptyState title="No hawker profile" text="Ask the factory to link your account." />;

  const today = data.recentIssues.find((i) => i.status === "Issued");
  const over = data.hawker.outstandingAmount > data.hawker.creditLimit;

  return (
    <>
      <div className={`card p-5 text-center ${over ? "border-red-200 bg-red-50" : "bg-mint-light"}`}>
        <div className="text-sm text-choco-light">Amount due</div>
        <div className="font-display text-4xl font-bold">{money(data.hawker.outstandingAmount)}</div>
        <div className="text-xs text-choco-light">Credit limit {money(data.hawker.creditLimit)} . Commission {data.hawker.commissionPercent}%</div>
        {over && <p className="mt-2 text-sm font-semibold text-red-700">Clear dues to get new stock.</p>}
      </div>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Today&apos;s stock</h2>
        {today ? (
          <>
            <ul className="space-y-2 text-sm">
              {today.items.map((i) => (
                <li key={i.variantId} className="flex justify-between">
                  <span>{i.name}</span>
                  <span className="font-semibold">{i.issuedQty} x {money(i.rate)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-choco/10 pt-3 font-semibold"><span>Stock value</span><span>{money(today.issuedValue)}</span></div>
            <p className="mt-2 text-xs text-choco-light">Bring back unsold items in the evening for settlement.</p>
          </>
        ) : <p className="text-sm text-choco-light">No stock taken today.</p>}
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">History</h2>
        <ul className="space-y-2 text-sm">
          {data.recentIssues.filter((i) => i.status === "Settled").map((i) => (
            <li key={i.id} className="rounded-xl bg-cream p-3">
              <div className="flex justify-between"><span className="font-semibold">{date(i.issueDate)}</span><StatusBadge value={i.status} /></div>
              <div className="mt-1 grid grid-cols-3 text-xs text-choco-light">
                <span>Sale {money(i.totalSaleValue)}</span><span>Earned {money(i.commission)}</span><span>Paid {money(i.cashCollected)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

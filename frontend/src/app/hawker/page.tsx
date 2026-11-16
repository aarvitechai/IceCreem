"use client";

import { Suspense } from "react";
import { AlertTriangle, History, IceCreamCone, Phone, Wallet } from "lucide-react";
import { RequireAuth } from "@/components/auth/require-auth";
import { MobileShell } from "@/components/layout/mobile-shell";
import { EmptyState, PageLoader, StatusBadge } from "@/components/ui";
import { useHawkerMeQuery } from "@/features/admin/api";
import { telLink } from "@/lib/brand";
import { date, money } from "@/lib/format";

export default function HawkerPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RequireAuth roles={["Hawker"]}>
        <MobileShell title="My cart" subtitle="Today's stock, money due and past days.">
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

  const { hawker } = data;
  const today = data.recentIssues.find((i) => i.status === "Issued");
  const settled = data.recentIssues.filter((i) => i.status === "Settled");
  const over = hawker.outstandingAmount > hawker.creditLimit;
  const used = hawker.creditLimit > 0 ? Math.min(100, Math.round((hawker.outstandingAmount / hawker.creditLimit) * 100)) : 0;

  return (
    <>
      <section className={`rounded-3xl p-5 shadow-sm ${over ? "bg-red-50 ring-2 ring-red-200" : "bg-white ring-1 ring-choco/5"}`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-choco-light"><Wallet className="size-4 text-berry" /> Amount due</span>
          <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-semibold">Commission {hawker.commissionPercent}%</span>
        </div>
        <div className={`mt-1 font-display text-5xl font-bold tracking-wide ${over ? "text-red-700" : ""}`}>{money(hawker.outstandingAmount)}</div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cream-dark" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={100} aria-label="Credit used">
          <div className={`h-full rounded-full ${over ? "bg-red-600" : "bg-gradient-to-r from-berry to-pink"}`} style={{ width: `${Math.max(used, 3)}%` }} />
        </div>
        <div className="mt-1 text-xs text-choco-light">{used}% of credit limit {money(hawker.creditLimit)} used</div>
        {over && (
          <p className="mt-3 flex items-center gap-2 rounded-2xl bg-red-100 p-3 text-sm font-semibold text-red-800">
            <AlertTriangle className="size-4 shrink-0" /> Over the limit. Clear dues to get new stock.
          </p>
        )}
      </section>

      <section className="surface p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold uppercase tracking-wide">
          <IceCreamCone className="size-5 text-berry" /> Today&apos;s stock
        </h2>
        {today ? (
          <>
            <ul className="space-y-2">
              {today.items.map((i) => (
                <li key={i.variantId} className="flex items-center justify-between gap-3 rounded-2xl bg-cream px-3 py-2.5">
                  <span className="text-sm font-medium">{i.name}</span>
                  <span className="shrink-0 text-sm"><span className="rounded-full bg-sun px-2 py-0.5 font-bold">{i.issuedQty}</span> × {money(i.rate)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-choco/15 pt-3">
              <span className="font-display text-lg font-semibold uppercase tracking-wide">Stock value</span>
              <span className="text-xl font-bold">{money(today.issuedValue)}</span>
            </div>
            <p className="mt-2 text-xs text-choco-light">Bring back unsold items in the evening for settlement.</p>
          </>
        ) : (
          <p className="rounded-2xl bg-cream p-4 text-center text-sm text-choco-light">No stock taken today. Visit the factory in the morning to load your cart.</p>
        )}
      </section>

      <section className="surface p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-semibold uppercase tracking-wide">
          <History className="size-5 text-berry" /> Past days
        </h2>
        {settled.length ? (
          <ul className="space-y-2">
            {settled.map((i) => (
              <li key={i.id} className="rounded-2xl bg-cream p-3">
                <div className="flex items-center justify-between"><span className="font-semibold">{date(i.issueDate)}</span><StatusBadge value={i.status} /></div>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Sale" value={money(i.totalSaleValue)} />
                  <Stat label="Earned" value={money(i.commission)} highlight />
                  <Stat label="Paid" value={money(i.cashCollected)} />
                </dl>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-choco-light">Settled days will show here.</p>}
      </section>

      <a href={telLink} className="btn-primary w-full py-3.5 text-base"><Phone className="size-4" /> Call the factory</a>
    </>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-1 py-1.5 ${highlight ? "bg-mint-light" : "bg-white"}`}>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-choco-light">{label}</dt>
      <dd className={`text-sm font-bold ${highlight ? "text-emerald-800" : ""}`}>{value}</dd>
    </div>
  );
}

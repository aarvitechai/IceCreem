"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { RankedBarChart, SalesTrendChart } from "@/components/admin/charts";
import { EmptyState, PageLoader, StatCard, StatusBadge } from "@/components/ui";
import {
  useCategoryShareQuery, useDashboardSummaryQuery, useOrderStatusShareQuery, useSalesTrendQuery, useTopProductsQuery,
} from "@/features/admin/api";
import { useAdminOrdersQuery } from "@/features/orders/api";
import { dateTime, money } from "@/lib/format";

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const { data: s, isLoading } = useDashboardSummaryQuery(undefined, { pollingInterval: 60_000 });
  const { data: trend } = useSalesTrendQuery(days);
  const { data: top } = useTopProductsQuery();
  const { data: cats } = useCategoryShareQuery();
  const { data: statuses } = useOrderStatusShareQuery();
  const { data: recent } = useAdminOrdersQuery({ page: 1 });

  if (isLoading || !s) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1>Dashboard</h1>
        <Link href="/admin/analytics" className="btn-primary btn-sm">Full analytics <ArrowRight className="size-4" /></Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Today's revenue" value={money(s.todayRevenue)} hint={`${s.todayOrders} orders today`} tone="berry" />
        <StatCard title="This month" value={money(s.monthRevenue)} hint={`${s.customers} registered customers`} tone="mint" />
        <StatCard title="Open orders" value={s.pendingOrders} hint={`${s.outForDelivery} out for delivery`} tone="mango" />
        <StatCard title="Events next 30 days" value={s.upcomingBookings} hint={`${s.openEnquiries} enquiries need a quote`} tone="choco" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/inventory" className={`card flex items-center justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-md ${s.lowStockItems > 0 ? "bg-red-50 ring-red-200" : ""}`}>
          <div>
            <div className="text-sm font-semibold">Low stock alerts</div>
            <div className="text-xs text-choco-light">Raw material or packs below minimum</div>
          </div>
          <span className={`text-2xl font-bold ${s.lowStockItems > 0 ? "text-red-600" : ""}`}>{s.lowStockItems > 0 ? `⚠ ${s.lowStockItems}` : "0"}</span>
        </Link>
        <Link href="/admin/hawkers" className="card flex items-center justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="text-sm font-semibold">Hawker outstanding</div>
            <div className="text-xs text-choco-light">Money to collect from street vendors</div>
          </div>
          <span className="text-2xl font-bold">{money(s.hawkerOutstanding)}</span>
        </Link>
      </div>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold uppercase tracking-wide">Revenue by day</h2>
          <div className="flex gap-1 rounded-full bg-cream p-1" role="group" aria-label="Range">
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => setDays(d)} aria-pressed={days === d} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${days === d ? "bg-berry text-white shadow" : "text-choco-light hover:text-berry"}`}>{d} days</button>
            ))}
          </div>
        </div>
        {trend ? <SalesTrendChart data={trend} /> : <div className="h-64" />}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-1 font-display text-xl font-semibold uppercase tracking-wide">Top products</h2>
          <p className="mb-4 text-xs text-choco-light">Revenue, last 30 days</p>
          {top?.length ? <RankedBarChart data={top} valueLabel="Revenue" /> : <p className="text-sm text-choco-light">No sales yet.</p>}
        </section>
        <section className="card p-5">
          <h2 className="mb-1 font-display text-xl font-semibold uppercase tracking-wide">Sales by category</h2>
          <p className="mb-4 text-xs text-choco-light">Revenue, last 30 days</p>
          {cats?.length ? <RankedBarChart data={cats} valueLabel="Revenue" /> : <p className="text-sm text-choco-light">No sales yet.</p>}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide">Latest orders</h2>
            <Link href="/admin/orders" className="text-xs font-semibold uppercase tracking-wider text-berry hover:underline">View all</Link>
          </div>
          {recent?.items.length ? (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {recent.items.slice(0, 6).map((o) => (
                    <tr key={o.id} className="hover:bg-cream/60">
                      <td><Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-berry">{o.orderNumber}</Link><div className="text-xs text-choco-light">{dateTime(o.createdAt)}</div></td>
                      <td>{o.customerName}</td>
                      <td><StatusBadge value={o.status} /></td>
                      <td className="text-right font-semibold">{money(o.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="p-5"><EmptyState title="No orders yet" /></div>}
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-display text-xl font-semibold uppercase tracking-wide">Orders by status (30 days)</h2>
          <ul className="space-y-2">
            {statuses?.map((st) => (
              <li key={st.name} className="flex items-center justify-between text-sm">
                <StatusBadge value={st.name} />
                <span className="font-semibold">{st.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

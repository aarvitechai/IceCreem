"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { ChartCard, ColumnChart, dayLabel, RankedBarChart, SalesTrendChart, Sparkline } from "@/components/admin/charts";
import { EmptyState, PageLoader } from "@/components/ui";
import { useAnalyticsQuery, type AnalyticsReport, type PeriodKpis } from "@/features/admin/api";
import { label, money } from "@/lib/format";

const RANGES = [7, 30, 90] as const;

type Kpi = {
  key: keyof PeriodKpis;
  title: string;
  format: (v: number) => string;
  /** True when a rise is bad news, like cancellations. */
  lowerIsBetter?: boolean;
  spark?: (r: AnalyticsReport) => number[];
};

const KPIS: Kpi[] = [
  { key: "revenue", title: "Revenue", format: money, spark: (r) => r.trend.map((t) => t.revenue) },
  { key: "orders", title: "Orders", format: (v) => v.toLocaleString("en-IN"), spark: (r) => r.trend.map((t) => t.orders) },
  { key: "avgOrderValue", title: "Average order", format: money },
  { key: "customers", title: "Customers", format: (v) => v.toLocaleString("en-IN") },
  { key: "newCustomers", title: "New customers", format: (v) => v.toLocaleString("en-IN") },
  { key: "discounts", title: "Discounts given", format: money, lowerIsBetter: true },
  { key: "cancelled", title: "Cancelled orders", format: (v) => v.toLocaleString("en-IN"), lowerIsBetter: true },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState<number>(30);
  const { data, isLoading, isFetching } = useAnalyticsQuery(days);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>Analytics</h1>
          <p className="text-sm text-choco-light">Last {days} days compared with the {days} days before. Cancelled and returned orders are left out of sales.</p>
        </div>
        <div className="flex gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-choco/5" role="group" aria-label="Date range">
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              aria-pressed={days === d}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${days === d ? "bg-berry text-white shadow" : "text-choco-light hover:text-berry"}`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? <PageLoader /> : <Report data={data} fetching={isFetching} />}
    </div>
  );
}

function Report({ data, fetching }: { data: AnalyticsReport; fetching: boolean }) {
  const hasSales = data.current.orders > 0;
  const weekdays = data.weekdays;
  const hours = data.hours.filter((h, i, all) => {
    // Show the working day only: from the first to the last hour that ever had an order, at least 9 to 22.
    const used = all.map((x, j) => (x.count > 0 ? j : -1)).filter((j) => j >= 0);
    const from = Math.min(9, ...used);
    const to = Math.max(22, ...used);
    return i >= from && i <= to;
  }).map((h) => ({ ...h, full: `${h.name}:00 to ${h.name}:59` }));
  const channels = data.channels.map((c) => ({ ...c, name: label(c.name) }));

  return (
    <div className={`space-y-6 transition-opacity ${fetching ? "opacity-60" : ""}`}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {KPIS.map((k) => (
          <KpiTile key={k.key} kpi={k} now={data.current[k.key]} before={data.previous[k.key]} spark={k.spark?.(data)} />
        ))}
      </div>

      {!hasSales ? (
        <EmptyState title="No sales in this period" text="Pick a longer range, or check back after the first orders come in." />
      ) : (
        <>
          <ChartCard
            title="Revenue by day"
            subtitle={`${money(data.current.revenue)} from ${data.current.orders} orders`}
            rows={data.trend.map((t) => ({ name: dayLabel(t.date), value: t.revenue, count: t.orders }))}
            valueLabel="Revenue"
          >
            <SalesTrendChart data={data.trend} height={280} />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Best days of the week" subtitle="Revenue by weekday. Darkest bar is the busiest." rows={weekdays} valueLabel="Revenue">
              <ColumnChart data={weekdays} valueLabel="Revenue" metric="money" />
            </ChartCard>
            <ChartCard title="Busiest hours" subtitle="Number of orders by hour of the day (India time)" rows={hours} valueLabel="Orders" metric="count">
              <ColumnChart data={hours} valueLabel="Orders" metric="count" />
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Top products" subtitle="Revenue in this period" rows={data.topProducts} valueLabel="Revenue">
              <RankedBarChart data={data.topProducts} valueLabel="Revenue" />
            </ChartCard>
            <ChartCard title="Top cities" subtitle="Where the orders go" rows={data.cities} valueLabel="Revenue">
              <RankedBarChart data={data.cities} valueLabel="Revenue" />
            </ChartCard>
          </div>

          <ChartCard title="Sales channels" subtitle="Home delivery, events and hawker supply" rows={channels} valueLabel="Revenue">
            <RankedBarChart data={channels} valueLabel="Revenue" />
          </ChartCard>
        </>
      )}
    </div>
  );
}

function KpiTile({ kpi, now, before, spark }: { kpi: Kpi; now: number; before: number; spark?: number[] }) {
  const change = before === 0 ? (now === 0 ? 0 : null) : ((now - before) / before) * 100;
  const up = (change ?? 1) > 0;
  const flat = change === 0;
  const good = flat ? null : kpi.lowerIsBetter ? !up : up;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const tone = good === null ? "bg-cream text-choco-light" : good ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700";

  return (
    <div className="card flex flex-col gap-1 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-choco-light">{kpi.title}</div>
      <div className="font-display text-3xl font-bold tracking-wide">{kpi.format(now)}</div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold ${tone}`}>
          <Icon className="size-3.5" aria-hidden />
          {change === null ? "New" : `${Math.abs(change).toFixed(0)}%`}
          <span className="sr-only">{flat ? "no change" : up ? "up" : "down"}</span>
        </span>
        <span className="text-choco-light">vs {kpi.format(before)} before</span>
      </div>
      {spark && spark.some((v) => v > 0) && <div className="-mx-1 mt-1"><Sparkline values={spark} /></div>}
    </div>
  );
}

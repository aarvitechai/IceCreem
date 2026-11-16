"use client";

import { useState } from "react";
import { Table2 } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/format";

/**
 * Every chart here shows a single series: one brand hue (validated against the white card),
 * no legend because the card title names it, thin marks, a recessive grid and a hover tooltip.
 * The busiest bar is drawn a step darker and labelled, so the answer is visible without hovering.
 */
const SERIES = "#e3504f";
const PEAK = "#b8393a";
const GRID = "rgba(42,31,29,0.08)";
const AXIS = { fontSize: 12, fill: "#5c4b47" };

export type Metric = "money" | "count";

const shortMoney = (v: number) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`);
const fmt = (m: Metric, v: number) => (m === "money" ? money(v) : v.toLocaleString("en-IN"));
const tick = (m: Metric) => (m === "money" ? shortMoney : (v: number) => v.toLocaleString("en-IN"));

interface TipRow { value: number; payload: Record<string, unknown> }

function TooltipBox({ active, payload, label, valueLabel, metric }: { active?: boolean; payload?: TipRow[]; label?: string; valueLabel: string; metric: Metric }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-2xl bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-choco/10">
      <div className="font-semibold">{(row.full as string) ?? label}</div>
      <div className="text-choco-light">{valueLabel}: <span className="font-semibold text-choco">{fmt(metric, payload[0].value)}</span></div>
      {metric === "money" && typeof row.count === "number" && <div className="text-choco-light">Orders or units: <span className="font-semibold text-choco">{row.count}</span></div>}
      {typeof row.orders === "number" && <div className="text-choco-light">Orders: <span className="font-semibold text-choco">{row.orders}</span></div>}
    </div>
  );
}

export const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", timeZone: "UTC" });

export function SalesTrendChart({ data, height = 260 }: { data: { date: string; revenue: number; orders: number }[]; height?: number }) {
  const rows = data.map((d) => ({ ...d, day: dayLabel(d.date) }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={SERIES} stopOpacity={0.25} />
            <stop offset="1" stopColor={SERIES} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={shortMoney} width={52} />
        <Tooltip content={<TooltipBox valueLabel="Revenue" metric="money" />} cursor={{ stroke: "rgba(42,31,29,0.25)" }} />
        <Area type="monotone" dataKey="revenue" stroke={SERIES} strokeWidth={2} fill="url(#rev)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Horizontal bars sorted by value. Better than a pie for comparing shares. */
export function RankedBarChart({ data, valueLabel, metric = "money" }: { data: { name: string; value: number; count: number }[]; valueLabel: string; metric?: Metric }) {
  const height = Math.max(160, data.length * 40 + 20);
  const rows = data.map((d) => ({ ...d, full: d.name, shown: metric === "money" ? d.value : d.count }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }} barCategoryGap={8}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={tick(metric)} hide />
        <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={130} />
        <Tooltip content={<TooltipBox valueLabel={valueLabel} metric={metric} />} cursor={{ fill: "rgba(227,80,79,0.06)" }} />
        <Bar dataKey="shown" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList dataKey="shown" position="right" formatter={(v) => (typeof v === "number" ? (metric === "money" ? shortMoney(v) : v) : "")} style={{ fontSize: 12, fill: "#2a1f1d", fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Upright bars for an ordered scale such as days of the week or hours. The peak is labelled. */
export function ColumnChart({ data, valueLabel, metric, height = 220 }: { data: { name: string; value: number; count: number; full?: string }[]; valueLabel: string; metric: Metric; height?: number }) {
  const rows = data.map((d) => ({ ...d, shown: metric === "money" ? d.value : d.count }));
  const peak = Math.max(...rows.map((r) => r.shown));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} margin={{ top: 22, right: 4, left: 0, bottom: 0 }} barCategoryGap="18%">
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={4} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={tick(metric)} width={metric === "money" ? 52 : 32} allowDecimals={false} />
        <Tooltip content={<TooltipBox valueLabel={valueLabel} metric={metric} />} cursor={{ fill: "rgba(227,80,79,0.06)" }} />
        <Bar dataKey="shown" radius={[4, 4, 0, 0]} maxBarSize={36}>
          {rows.map((r) => <Cell key={r.name} fill={peak > 0 && r.shown === peak ? PEAK : SERIES} />)}
          <LabelList
            dataKey="shown"
            position="top"
            content={({ x, y, width, value }) =>
              peak > 0 && value === peak ? (
                <text x={Number(x) + Number(width) / 2} y={Number(y) - 6} textAnchor="middle" fontSize={12} fontWeight={700} fill="#2a1f1d">
                  {metric === "money" ? shortMoney(Number(value)) : String(value)}
                </text>
              ) : null
            }
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Tiny trend line for a KPI tile. No axes, the tile shows the number. */
export function Sparkline({ values, color = SERIES }: { values: number[]; color?: string }) {
  const rows = values.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={rows} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.12} isAnimationActive={false} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Card that holds one chart, with a switch to see the same numbers as a table. */
export function ChartCard({
  title, subtitle, rows, valueLabel, metric = "money", children, className = "",
}: {
  title: string;
  subtitle?: string;
  rows: { name: string; value: number; count: number }[];
  valueLabel: string;
  metric?: Metric;
  children: React.ReactNode;
  className?: string;
}) {
  const [table, setTable] = useState(false);
  return (
    <section className={`card p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold uppercase tracking-wide">{title}</h2>
          {subtitle && <p className="text-xs text-choco-light">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setTable((t) => !t)}
          aria-pressed={table}
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${table ? "bg-choco text-white" : "bg-cream text-choco-light hover:text-berry"}`}
        >
          <Table2 className="size-3.5" /> Table
        </button>
      </div>
      {table ? (
        <div className="max-h-72 overflow-auto">
          <table className="table-base">
            <thead><tr><th>Name</th><th className="text-right">{valueLabel}</th>{metric === "money" && <th className="text-right">Count</th>}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td className="text-right font-semibold">{fmt(metric, metric === "money" ? r.value : r.count)}</td>
                  {metric === "money" && <td className="text-right">{r.count}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : children}
    </section>
  );
}

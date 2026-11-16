"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money } from "@/lib/format";

/**
 * Every chart here shows a single series, so one brand hue, no legend (the title names it),
 * thin marks, recessive grid and a hover tooltip.
 */
const SERIES = "#d63a6e";
const GRID = "rgba(59,36,24,0.08)";
const AXIS = { fontSize: 12, fill: "#6b4a3a" };

const shortMoney = (v: number) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`);

function TooltipBox({ active, payload, label, valueLabel }: { active?: boolean; payload?: { value: number; payload: Record<string, unknown> }[]; label?: string; valueLabel: string }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-choco/10 bg-white px-3 py-2 text-xs shadow-md">
      <div className="font-semibold">{label}</div>
      <div className="text-choco-light">{valueLabel}: <span className="font-semibold text-choco">{money(payload[0].value)}</span></div>
      {typeof row.count === "number" && <div className="text-choco-light">Units: <span className="font-semibold text-choco">{row.count}</span></div>}
      {typeof row.orders === "number" && <div className="text-choco-light">Orders: <span className="font-semibold text-choco">{row.orders}</span></div>}
    </div>
  );
}

export function SalesTrendChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  const rows = data.map((d) => ({ ...d, day: new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={SERIES} stopOpacity={0.25} />
            <stop offset="1" stopColor={SERIES} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={shortMoney} width={48} />
        <Tooltip content={<TooltipBox valueLabel="Revenue" />} cursor={{ stroke: "rgba(59,36,24,0.25)" }} />
        <Area type="monotone" dataKey="revenue" stroke={SERIES} strokeWidth={2} fill="url(#rev)" activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Horizontal bars sorted by value. Better than a pie for comparing shares. */
export function RankedBarChart({ data, valueLabel }: { data: { name: string; value: number; count: number }[]; valueLabel: string }) {
  const height = Math.max(160, data.length * 40 + 20);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={8}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={shortMoney} />
        <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={130} />
        <Tooltip content={<TooltipBox valueLabel={valueLabel} />} cursor={{ fill: "rgba(214,58,110,0.06)" }} />
        <Bar dataKey="value" fill={SERIES} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

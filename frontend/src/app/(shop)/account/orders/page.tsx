"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Package } from "lucide-react";
import { EmptyState, PageLoader, Pager, StatusBadge } from "@/components/ui";
import { useMyOrdersQuery } from "@/features/orders/api";
import { dateTime, money } from "@/lib/format";

export default function MyOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyOrdersQuery(page);

  if (isLoading) return <PageLoader />;
  if (!data || data.items.length === 0) {
    return <EmptyState title="No orders yet" text="Your orders will show up here." action={<Link href="/products" className="btn-primary">Start shopping</Link>} />;
  }

  return (
    <div className="space-y-3">
      {data.items.map((o) => (
        <Link key={o.id} href={`/account/orders/${o.id}`} className="surface group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-pink-light text-berry"><Package className="size-6" /></span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg font-semibold uppercase tracking-wide">{o.orderNumber}</div>
            <div className="text-xs text-choco-light">{dateTime(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? "item" : "items"}</div>
          </div>
          <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
            <StatusBadge value={o.status} />
            <span className="text-lg font-bold">{money(o.grandTotal)}</span>
          </div>
          <ChevronRight className="size-5 shrink-0 text-choco/30 transition group-hover:translate-x-1 group-hover:text-berry" />
        </Link>
      ))}
      <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />
    </div>
  );
}

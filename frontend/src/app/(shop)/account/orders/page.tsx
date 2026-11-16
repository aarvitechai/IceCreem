"use client";

import Link from "next/link";
import { useState } from "react";
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
        <Link key={o.id} href={`/account/orders/${o.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-5 transition hover:shadow-md">
          <div>
            <div className="font-semibold">{o.orderNumber}</div>
            <div className="text-sm text-choco-light">{dateTime(o.createdAt)} . {o.itemCount} items</div>
          </div>
          <div className="flex items-center gap-4">
            <StatusBadge value={o.status} />
            <span className="font-bold">{money(o.grandTotal)}</span>
          </div>
        </Link>
      ))}
      <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />
    </div>
  );
}

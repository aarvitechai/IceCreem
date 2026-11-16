"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, PageLoader, Pager, StatusBadge } from "@/components/ui";
import { useAdminOrdersQuery } from "@/features/orders/api";
import { dateTime, label, money } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["Placed", "Confirmed", "InProduction", "Packed", "OutForDelivery", "Delivered", "Cancelled", "Returned"];

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [search, setSearch] = useState("");
  const { data, isLoading, isFetching } = useAdminOrdersQuery({ page, status, search });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search order number, name or mobile" className="input sm:max-w-sm" />
        <select value={status} onChange={(e) => { setStatus(e.target.value as OrderStatus | ""); setPage(1); }} className="input sm:w-56" aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
      </div>

      {isLoading ? <PageLoader /> : !data?.items.length ? <EmptyState title="No orders found" /> : (
        <div className={`card overflow-x-auto ${isFetching ? "opacity-70" : ""}`}>
          <table className="table-base">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Items</th><th>Status</th><th>Payment</th><th>Rider</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id} className="hover:bg-cream/60">
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-berry">{o.orderNumber}</Link>
                    <div className="text-xs text-choco-light">{dateTime(o.createdAt)}</div>
                  </td>
                  <td>{o.customerName}<div className="text-xs text-choco-light">{o.customerMobile} . {o.city}</div></td>
                  <td>{o.itemCount}</td>
                  <td><StatusBadge value={o.status} /></td>
                  <td><StatusBadge value={o.paymentStatus} /></td>
                  <td className="text-sm">{o.deliveryPartnerName ?? <span className="text-choco/40">-</span>}</td>
                  <td className="text-right font-semibold">{money(o.grandTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  );
}

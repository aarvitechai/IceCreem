"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AppImage, EmptyState, PageLoader, Pager } from "@/components/ui";
import { useAdminProductsQuery, useDeleteProductMutation, useSetProductStatusMutation } from "@/features/admin/api";
import { money } from "@/lib/format";
import { errorMessage } from "@/store/api";

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminProductsQuery({ page, search });
  const [setStatus] = useSetProductStatusMutation();
  const [remove] = useDeleteProductMutation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new" className="btn-primary"><Plus className="size-4" /> Add product</Link>
      </div>
      <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or SKU" className="input max-w-sm" />

      {isLoading ? <PageLoader /> : !data?.items.length ? <EmptyState title="No products" /> : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Product</th><th>Category</th><th>From</th><th>Packs</th><th>Stock</th><th>Active</th><th /></tr></thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="hover:bg-cream/60">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="relative size-12 overflow-hidden rounded-lg bg-cream-dark"><AppImage src={p.imageUrl} alt="" sizes="48px" /></div>
                      <div>
                        <Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-berry">{p.name}</Link>
                        {p.isFeatured && <div className="text-xs text-berry">Featured</div>}
                      </div>
                    </div>
                  </td>
                  <td>{p.categoryName}</td>
                  <td>{money(p.price)}</td>
                  <td>{p.variantCount}</td>
                  <td className={p.totalStock < 20 ? "font-semibold text-red-600" : ""}>{p.totalStock}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={p.isActive}
                      onChange={(e) => setStatus({ id: p.id, isActive: e.target.checked }).unwrap().catch((err) => toast.error(errorMessage(err)))}
                      className="size-4 accent-berry"
                      aria-label={`Active ${p.name}`}
                    />
                  </td>
                  <td className="space-x-2 whitespace-nowrap text-right">
                    <Link href={`/admin/products/${p.id}`} className="btn-outline btn-sm">Edit</Link>
                    <button
                      className="btn-ghost btn-sm text-red-600"
                      onClick={async () => {
                        if (!confirm(`Delete ${p.name}?`)) return;
                        try { await remove(p.id).unwrap(); toast.success("Deleted"); } catch (err) { toast.error(errorMessage(err)); }
                      }}
                    >
                      Delete
                    </button>
                  </td>
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

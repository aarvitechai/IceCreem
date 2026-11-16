"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal, PageLoader, TextField } from "@/components/ui";
import { useAdminCategoriesQuery, useDeleteCategoryMutation, useSaveCategoryMutation } from "@/features/admin/api";
import type { Category } from "@/lib/types";
import { errorMessage } from "@/store/api";

export default function CategoriesPage() {
  const { data, isLoading } = useAdminCategoriesQuery();
  const [save, { isLoading: saving }] = useSaveCategoryMutation();
  const [remove] = useDeleteCategoryMutation();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  const submit = async () => {
    if (!editing?.name) return;
    try {
      await save({ id: editing.id, name: editing.name, imageUrl: editing.imageUrl ?? null, sortOrder: Number(editing.sortOrder ?? 0), isActive: editing.isActive ?? true }).unwrap();
      toast.success("Saved");
      setEditing(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <button onClick={() => setEditing({ isActive: true, sortOrder: (data?.length ?? 0) + 1 })} className="btn-primary">Add category</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Order</th><th>Name</th><th>Slug</th><th>Products</th><th>Active</th><th /></tr></thead>
          <tbody>
            {data?.map((c) => (
              <tr key={c.id}>
                <td>{c.sortOrder}</td>
                <td className="font-semibold">{c.name}</td>
                <td className="text-choco-light">{c.slug}</td>
                <td>{c.productCount}</td>
                <td>{c.isActive ? "Yes" : "No"}</td>
                <td className="space-x-2 text-right">
                  <button onClick={() => setEditing(c)} className="btn-outline btn-sm">Edit</button>
                  <button
                    className="btn-ghost btn-sm text-red-600"
                    onClick={async () => {
                      if (!confirm(`Delete ${c.name}?`)) return;
                      try { await remove(c.id).unwrap(); toast.success("Deleted"); } catch (e) { toast.error(errorMessage(e)); }
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
      <Modal open={!!editing} title={editing?.id ? "Edit category" : "New category"} onClose={() => setEditing(null)}>
        <div className="space-y-4">
          <TextField label="Name" value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          <TextField label="Image URL" value={editing?.imageUrl ?? ""} onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })} hint="For example /images/categories/tubs.svg" />
          <TextField label="Sort order" type="number" value={editing?.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing?.isActive ?? true} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="accent-berry" /> Active</label>
          <button onClick={submit} disabled={saving || !editing?.name} className="btn-primary w-full">Save</button>
        </div>
      </Modal>
    </div>
  );
}

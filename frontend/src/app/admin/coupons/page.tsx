"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal, PageLoader, SelectField, TextField } from "@/components/ui";
import { type Coupon, useCouponsQuery, useDeleteCouponMutation, useSaveCouponMutation } from "@/features/orders/api";
import { date, money } from "@/lib/format";
import { errorMessage } from "@/store/api";

type Draft = Omit<Coupon, "id" | "usedCount"> & { id?: number };

const today = () => new Date().toISOString().slice(0, 10);
const newDraft = (): Draft => ({
  code: "", isPercent: true, value: 10, minOrderAmount: 0, maxDiscount: 0,
  validFrom: today(), validTo: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), usageLimit: 0, isActive: true,
});

export default function CouponsPage() {
  const { data, isLoading } = useCouponsQuery();
  const [save, { isLoading: saving }] = useSaveCouponMutation();
  const [remove] = useDeleteCouponMutation();
  const [draft, setDraft] = useState<Draft | null>(null);
  const set = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const submit = async () => {
    if (!draft) return;
    try {
      await save({ ...draft, validFrom: new Date(draft.validFrom).toISOString(), validTo: new Date(`${draft.validTo.slice(0, 10)}T23:59:59`).toISOString() }).unwrap();
      toast.success("Coupon saved");
      setDraft(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button onClick={() => setDraft(newDraft())} className="btn-primary">Add coupon</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Valid</th><th>Used</th><th>Active</th><th /></tr></thead>
          <tbody>
            {data?.map((c) => (
              <tr key={c.id}>
                <td className="font-mono font-semibold">{c.code}</td>
                <td>{c.isPercent ? `${c.value}%` : money(c.value)}{c.maxDiscount > 0 && <span className="text-xs text-choco-light"> up to {money(c.maxDiscount)}</span>}</td>
                <td>{money(c.minOrderAmount)}</td>
                <td className="text-xs">{date(c.validFrom)} to {date(c.validTo)}</td>
                <td>{c.usedCount}{c.usageLimit > 0 && ` / ${c.usageLimit}`}</td>
                <td>{c.isActive ? "Yes" : "No"}</td>
                <td className="space-x-2 text-right">
                  <button onClick={() => setDraft({ ...c, validFrom: c.validFrom.slice(0, 10), validTo: c.validTo.slice(0, 10) })} className="btn-outline btn-sm">Edit</button>
                  <button
                    className="btn-ghost btn-sm text-red-600"
                    onClick={async () => {
                      if (!confirm(`Delete ${c.code}?`)) return;
                      try { await remove(c.id).unwrap(); } catch (e) { toast.error(errorMessage(e)); }
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

      <Modal open={!!draft} title={draft?.id ? "Edit coupon" : "New coupon"} onClose={() => setDraft(null)}>
        {draft && (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><TextField label="Code" value={draft.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} /></div>
            <SelectField label="Type" value={draft.isPercent ? "p" : "f"} onChange={(e) => set({ isPercent: e.target.value === "p" })}>
              <option value="p">Percent</option><option value="f">Flat amount</option>
            </SelectField>
            <TextField label="Value" type="number" value={draft.value} onChange={(e) => set({ value: Number(e.target.value) })} />
            <TextField label="Min order (Rs)" type="number" value={draft.minOrderAmount} onChange={(e) => set({ minOrderAmount: Number(e.target.value) })} />
            <TextField label="Max discount (0 = none)" type="number" value={draft.maxDiscount} onChange={(e) => set({ maxDiscount: Number(e.target.value) })} />
            <TextField label="Valid from" type="date" value={draft.validFrom.slice(0, 10)} onChange={(e) => set({ validFrom: e.target.value })} />
            <TextField label="Valid to" type="date" value={draft.validTo.slice(0, 10)} onChange={(e) => set({ validTo: e.target.value })} />
            <TextField label="Usage limit (0 = none)" type="number" value={draft.usageLimit} onChange={(e) => set({ usageLimit: Number(e.target.value) })} />
            <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" checked={draft.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="accent-berry" /> Active</label>
            <button onClick={submit} disabled={saving || !draft.code} className="btn-primary col-span-2">Save coupon</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

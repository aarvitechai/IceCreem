"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal, PageLoader, StatusBadge, TextField } from "@/components/ui";
import {
  type Hawker, type StockIssue, useFinishedStockQuery, useHawkerPaymentMutation, useHawkerQuery, useHawkersQuery,
  useIssueStockMutation, useSaveHawkerMutation, useSettleIssueMutation,
} from "@/features/admin/api";
import { date, money } from "@/lib/format";
import { errorMessage } from "@/store/api";

export default function HawkersPage() {
  const { data, isLoading } = useHawkersQuery();
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState<Partial<Hawker> | null>(null);

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hawkers</h1>
        <button onClick={() => setEditing({ commissionPercent: 10, creditLimit: 5000, isActive: true })} className="btn-primary">Add hawker</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((h) => (
          <div key={h.id} className="card space-y-3 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold">{h.name}</div>
                <div className="text-sm text-choco-light">{h.area} . {h.mobile}</div>
              </div>
              {!h.isActive && <StatusBadge value="Closed" />}
            </div>
            <dl className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-cream p-2"><dt className="text-choco-light">Due</dt><dd className={`text-sm font-bold ${h.outstandingAmount > h.creditLimit ? "text-red-600" : ""}`}>{money(h.outstandingAmount)}</dd></div>
              <div className="rounded-xl bg-cream p-2"><dt className="text-choco-light">Limit</dt><dd className="text-sm font-bold">{money(h.creditLimit)}</dd></div>
              <div className="rounded-xl bg-cream p-2"><dt className="text-choco-light">Commission</dt><dd className="text-sm font-bold">{h.commissionPercent}%</dd></div>
            </dl>
            <div className="flex gap-2">
              <button onClick={() => setSelected(h.id)} className="btn-primary btn-sm flex-1">{h.hasOpenIssue ? "Settle today" : "Issue stock"}</button>
              <button onClick={() => setEditing(h)} className="btn-outline btn-sm">Edit</button>
            </div>
          </div>
        ))}
      </div>
      {selected && <HawkerPanel id={selected} onClose={() => setSelected(null)} />}
      {editing && <HawkerForm hawker={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function HawkerForm({ hawker, onClose }: { hawker: Partial<Hawker>; onClose: () => void }) {
  const [form, setForm] = useState(hawker);
  const [save, { isLoading }] = useSaveHawkerMutation();
  return (
    <Modal open title={hawker.id ? "Edit hawker" : "New hawker"} onClose={onClose}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><TextField label="Name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <TextField label="Mobile" value={form.mobile ?? ""} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        <TextField label="Area or route" value={form.area ?? ""} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        <TextField label="Commission %" type="number" value={form.commissionPercent ?? 0} onChange={(e) => setForm({ ...form, commissionPercent: Number(e.target.value) })} />
        <TextField label="Credit limit (Rs)" type="number" value={form.creditLimit ?? 0} onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="accent-berry" /> Active</label>
        <button
          disabled={isLoading}
          className="btn-primary col-span-2"
          onClick={async () => {
            try {
              await save({ id: form.id, name: form.name ?? "", mobile: form.mobile ?? "", area: form.area ?? "", commissionPercent: form.commissionPercent ?? 0, creditLimit: form.creditLimit ?? 0, isActive: form.isActive ?? true }).unwrap();
              toast.success("Saved");
              onClose();
            } catch (e) {
              toast.error(errorMessage(e));
            }
          }}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

function HawkerPanel({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, isLoading } = useHawkerQuery(id);
  const [pay, { isLoading: paying }] = useHawkerPaymentMutation();
  const [amount, setAmount] = useState("");
  const open = data?.recentIssues.find((i) => i.status === "Issued");

  return (
    <Modal open title={data?.hawker.name ?? "Hawker"} onClose={onClose}>
      {isLoading || !data ? <PageLoader /> : (
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-2xl bg-cream p-4">
            <div><div className="text-xs text-choco-light">Outstanding</div><div className="text-2xl font-bold">{money(data.hawker.outstandingAmount)}</div></div>
            <div className="flex items-end gap-2">
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="Amount" className="input w-28 py-1.5" aria-label="Payment amount" />
              <button
                disabled={!Number(amount) || paying}
                className="btn-outline btn-sm"
                onClick={async () => {
                  try { await pay({ hawkerId: id, amount: Number(amount) }).unwrap(); toast.success("Payment received"); setAmount(""); } catch (e) { toast.error(errorMessage(e)); }
                }}
              >
                Receive
              </button>
            </div>
          </div>
          {open ? <SettleForm issue={open} /> : <IssueForm hawkerId={id} />}
          <div>
            <h4 className="mb-2 text-sm font-semibold">Recent days</h4>
            <ul className="space-y-1 text-xs">
              {data.recentIssues.filter((i) => i.status === "Settled").slice(0, 7).map((i) => (
                <li key={i.id} className="flex justify-between rounded-lg bg-cream px-3 py-2">
                  <span>{date(i.issueDate)}</span>
                  <span>Sale {money(i.totalSaleValue)} . Commission {money(i.commission)} . Cash {money(i.cashCollected)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Modal>
  );
}

function IssueForm({ hawkerId }: { hawkerId: number }) {
  const { data: stock } = useFinishedStockQuery();
  const [issue, { isLoading }] = useIssueStockMutation();
  const [qty, setQty] = useState<Record<number, string>>({});
  const items = Object.entries(qty).filter(([, q]) => Number(q) > 0).map(([v, q]) => ({ variantId: Number(v), quantity: Number(q) }));

  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Issue today&apos;s stock</h4>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {stock?.filter((s) => s.availableQty > 0).map((s) => (
          <div key={s.variantId} className="flex items-center justify-between gap-3 text-sm">
            <span>{s.productName} <span className="text-choco-light">{s.variantName} ({s.availableQty})</span></span>
            <input type="number" min={0} max={s.availableQty} value={qty[s.variantId] ?? ""} onChange={(e) => setQty({ ...qty, [s.variantId]: e.target.value })} className="input w-20 py-1" aria-label={`Quantity ${s.sku}`} />
          </div>
        ))}
      </div>
      <button
        disabled={!items.length || isLoading}
        className="btn-primary w-full"
        onClick={async () => {
          try { await issue({ hawkerId, items }).unwrap(); toast.success("Stock issued"); setQty({}); } catch (e) { toast.error(errorMessage(e)); }
        }}
      >
        Issue stock
      </button>
    </div>
  );
}

function SettleForm({ issue }: { issue: StockIssue }) {
  const [settle, { isLoading }] = useSettleIssueMutation();
  const [rows, setRows] = useState(issue.items.map((i) => ({ variantId: i.variantId, sold: i.issuedQty, returned: 0, damaged: 0 })));
  const [cash, setCash] = useState("");
  const update = (i: number, key: "sold" | "returned" | "damaged", v: string) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, [key]: Number(v) || 0 } : r)));
  const sale = rows.reduce((sum, r, i) => sum + r.sold * issue.items[i].rate, 0);

  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Settle stock of {date(issue.issueDate)}</h4>
      <div className="grid grid-cols-[1fr_repeat(3,64px)] gap-2 text-xs font-semibold text-choco-light"><span>Item (issued)</span><span>Sold</span><span>Return</span><span>Damage</span></div>
      {issue.items.map((it, i) => {
        const r = rows[i];
        const ok = r.sold + r.returned + r.damaged === it.issuedQty;
        return (
          <div key={it.variantId} className="grid grid-cols-[1fr_repeat(3,64px)] items-center gap-2 text-sm">
            <span className={ok ? "" : "text-red-600"}>{it.name} ({it.issuedQty})</span>
            <input type="number" value={r.sold} onChange={(e) => update(i, "sold", e.target.value)} className="input px-2 py-1" aria-label="Sold" />
            <input type="number" value={r.returned} onChange={(e) => update(i, "returned", e.target.value)} className="input px-2 py-1" aria-label="Returned" />
            <input type="number" value={r.damaged} onChange={(e) => update(i, "damaged", e.target.value)} className="input px-2 py-1" aria-label="Damaged" />
          </div>
        );
      })}
      <div className="flex items-end justify-between gap-3">
        <div className="text-sm">Sale value <b>{money(sale)}</b></div>
        <div className="w-36"><TextField label="Cash collected" type="number" value={cash} onChange={(e) => setCash(e.target.value)} /></div>
      </div>
      <button
        disabled={isLoading}
        className="btn-primary w-full"
        onClick={async () => {
          try { await settle({ issueId: issue.id, items: rows, cashCollected: Number(cash) || 0 }).unwrap(); toast.success("Settled"); } catch (e) { toast.error(errorMessage(e)); }
        }}
      >
        Save settlement
      </button>
    </div>
  );
}

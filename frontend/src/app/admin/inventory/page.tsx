"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Modal, PageLoader, SelectField, TextField } from "@/components/ui";
import {
  type RawMaterial, useAdjustFinishedMutation, useFinishedStockQuery, useMoveRawStockMutation, useRawLedgerQuery,
  useRawMaterialsQuery, useSaveRawMaterialMutation,
} from "@/features/admin/api";
import { dateTime, money } from "@/lib/format";
import type { StockTxnType } from "@/lib/types";
import { errorMessage } from "@/store/api";

export default function InventoryPage() {
  const [tab, setTab] = useState<"raw" | "finished">("raw");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventory</h1>
      <div className="flex gap-2">
        {(["raw", "finished"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`btn-sm btn ${tab === t ? "bg-choco text-white" : "bg-white text-choco-light"}`}>
            {t === "raw" ? "Raw material" : "Finished goods"}
          </button>
        ))}
      </div>
      {tab === "raw" ? <RawTab /> : <FinishedTab />}
    </div>
  );
}

function RawTab() {
  const { data, isLoading } = useRawMaterialsQuery();
  const [save] = useSaveRawMaterialMutation();
  const [move, { isLoading: moving }] = useMoveRawStockMutation();
  const [selected, setSelected] = useState<RawMaterial | null>(null);
  const [type, setType] = useState<StockTxnType>("In");
  const [qty, setQty] = useState("");
  const [remark, setRemark] = useState("");
  const [creating, setCreating] = useState<{ name: string; unit: string; minStockLevel: number } | null>(null);

  if (isLoading) return <PageLoader />;

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => setCreating({ name: "", unit: "kg", minStockLevel: 0 })} className="btn-primary btn-sm">Add raw material</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead><tr><th>Material</th><th>In stock</th><th>Minimum</th><th>Status</th><th /></tr></thead>
          <tbody>
            {data?.map((m) => (
              <tr key={m.id} className={m.isLow ? "bg-red-50/60" : ""}>
                <td className="font-semibold">{m.name}</td>
                <td>{m.currentStock} {m.unit}</td>
                <td className="text-choco-light">{m.minStockLevel} {m.unit}</td>
                <td>{m.isLow ? <span className="font-semibold text-red-600">⚠ Low stock</span> : <span className="text-emerald-700">OK</span>}</td>
                <td className="text-right"><button onClick={() => { setSelected(m); setQty(""); setRemark(""); setType("In"); }} className="btn-outline btn-sm">Stock in / out</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!selected} title={selected ? `${selected.name} stock` : ""} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Movement" value={type} onChange={(e) => setType(e.target.value as StockTxnType)}>
                <option value="In">Stock in (purchase)</option>
                <option value="Out">Stock out (use)</option>
                <option value="Wastage">Wastage</option>
              </SelectField>
              <TextField label={`Quantity (${selected.unit})`} type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            <TextField label="Remark" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Supplier bill no, reason..." />
            <button
              disabled={moving || !Number(qty)}
              className="btn-primary w-full"
              onClick={async () => {
                try {
                  await move({ id: selected.id, type, quantity: Number(qty), remark }).unwrap();
                  toast.success("Stock updated");
                  setQty("");
                } catch (e) {
                  toast.error(errorMessage(e));
                }
              }}
            >
              Save
            </button>
            <Ledger id={selected.id} unit={selected.unit} />
          </div>
        )}
      </Modal>

      <Modal open={!!creating} title="New raw material" onClose={() => setCreating(null)}>
        {creating && (
          <div className="space-y-4">
            <TextField label="Name" value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Unit" value={creating.unit} onChange={(e) => setCreating({ ...creating, unit: e.target.value })} />
              <TextField label="Minimum stock" type="number" value={creating.minStockLevel} onChange={(e) => setCreating({ ...creating, minStockLevel: Number(e.target.value) })} />
            </div>
            <button
              className="btn-primary w-full"
              disabled={!creating.name}
              onClick={async () => {
                try { await save(creating).unwrap(); toast.success("Added"); setCreating(null); } catch (e) { toast.error(errorMessage(e)); }
              }}
            >
              Save
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

function Ledger({ id, unit }: { id: number; unit: string }) {
  const { data } = useRawLedgerQuery(id);
  if (!data?.length) return null;
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">Recent movements</h4>
      <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
        {data.slice(0, 20).map((t) => (
          <li key={t.id} className="flex justify-between rounded-lg bg-cream px-3 py-1.5">
            <span>{dateTime(t.at)} . {t.type} {t.refNo ? `(${t.refNo})` : ""} {t.remark}</span>
            <span className="font-semibold">{t.type === "In" ? "+" : "-"}{t.quantity} {unit} = {t.balanceAfter}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FinishedTab() {
  const { data, isLoading } = useFinishedStockQuery();
  const [adjust] = useAdjustFinishedMutation();

  if (isLoading) return <PageLoader />;
  return (
    <div className="card overflow-x-auto">
      <table className="table-base">
        <thead><tr><th>Product</th><th>SKU</th><th>In stock</th><th>Reserved</th><th>Available</th><th>Value</th><th /></tr></thead>
        <tbody>
          {data?.map((s) => (
            <tr key={s.variantId} className={s.availableQty < 10 ? "bg-red-50/60" : ""}>
              <td className="font-semibold">{s.productName}<div className="text-xs font-normal text-choco-light">{s.variantName}</div></td>
              <td className="font-mono text-xs">{s.sku}</td>
              <td>{s.stockQty}</td>
              <td className="text-choco-light">{s.reservedQty}</td>
              <td className={s.availableQty < 10 ? "font-semibold text-red-600" : "font-semibold"}>{s.availableQty}</td>
              <td>{money(s.stockQty * s.sellingPrice)}</td>
              <td className="text-right">
                <button
                  className="btn-outline btn-sm"
                  onClick={async () => {
                    const qty = Number(prompt(`Adjust ${s.sku}. Use a negative number to remove.`, "0"));
                    if (!qty) return;
                    const reason = prompt("Reason for adjustment", "Physical count") ?? "";
                    try { await adjust({ variantId: s.variantId, quantity: qty, reason }).unwrap(); toast.success("Adjusted"); } catch (e) { toast.error(errorMessage(e)); }
                  }}
                >
                  Adjust
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
